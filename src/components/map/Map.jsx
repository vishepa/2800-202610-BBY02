import MapSimButton from "./MapSimButton.jsx";
import 'maplibre-gl/dist/maplibre-gl.css';
import MapLibre, { NavigationControl } from 'react-map-gl/maplibre';
import {
    VANCOUVER_CENTER,
    DEFAULT_ZOOM,
    MIN_ZOOM,
    MAX_ZOOM,
    MAP_STYLE  
} from '../../constants/mapDefaults.js';
import { useScreenWidth } from '../shared/useScreenWidth.jsx';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import DeckGLOverlay  from './DeckGLOverlay';
import { getFoodAssetLayers, buildFoodClusterIndex } from '../../layers/foodAssetLayer';
import { getTransitAssetLayer } from '../../layers/transitLayer.js';
import { getSimAssetLayers } from "../../layers/simAssetLayer.js";
import { useTransitStops } from '../../lib/hooks/useTransitStops.js';
import { useFoodAssets } from '../../lib/hooks/useFoodAssets';
import { getDisseminationAreaLayer, getDAHighlightLayer } from '../../layers/disseminationAreaLayer.js';
import {LayerPopup} from './popups/LayerPopup.jsx';
import SearchBar from "./SearchBar";

export function Map({
    active,
    setActive,
    foodLayerVisible,
    transitLayerVisible,
    disseminationLayerVisible,
    disseminationData,
    selectedCategory,
    activeFoodCategories,
    scoreWeights,
    isochroneMinutes,
    placedAssets,
    addPlacedAsset,
    showSimulation,
    focusSignal,
    heritageMode,
    selectedItem,
    setSelectedDA,
    setSelectedFoodAsset,
    setSelectedTransitStop,
    setSidebarOpen,
}) {
    
    // Data fetching hooks
    const { data: foodData } = useFoodAssets();
    const { data: transitData } = useTransitStops();

    const [activeRoutes, setActiveRoutes] = useState(null);

    // Selected state for the popups
    const [selected, setSelected] = useState(null);

    const mapRef = useRef(null);
    // Caches the Positron style's original `fill-color` value for each
    // water-fill layer on first heritage entry, so we can restore the
    // exact value (string or expression) on exit. setPaintProperty(_, null)
    // is NOT a "reset to default" call — it sets a literal null and
    // renders the layer black, which is the bug this cache fixes.
    //
    // Plain null-prototype object instead of a real `Map`: this file's
    // own component is named `Map`, so `new Map()` here would try to
    // construct the React component (and crash on the destructured props).
    const originalWaterColors = useRef(Object.create(null));
    // Same cache pattern for text labels — we snapshot text-color,
    // text-halo-color, text-halo-width, text-letter-spacing, and text-font
    // per symbol layer on first heritage entry so we can restore the
    // exact original state on exit.
    const originalLabelStyles = useRef(Object.create(null));
    const inPlacementMode = active === 'sim' && selectedCategory !== null;
    const selectedDA = selectedItem?.type === 'da' ? selectedItem.data : null;

    // Tracks whether MapLibre has finished loading its style — guards the
    // focus effect below so we don't try to flyTo on an unloaded map.
    const [mapLoaded, setMapLoaded] = useState(false);
    // Last focusSignal value we've already flown to (so re-renders don't
    // re-fly to the same load).
    const lastFocusedRef = useRef(0);

    // Screen width constants
    const width = useScreenWidth();
    const isDesktop = width >= 760;

    const [foodViewport, setFoodViewport] = useState(null);
    const handleMapMove = useCallback(() => {
        const map = mapRef.current;
        if (!map) return;
        const bounds = map.getBounds();
        setFoodViewport({
            zoom: map.getZoom(),
            bbox: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
        });
    }, []);

    const handleMapLoad = useCallback(() => {
        setMapLoaded(true);
        handleMapMove();

        const map = mapRef.current?.getMap?.();
        if (!map) return;
        map.getCanvas().style.cursor = 'default';

        map.on('dragstart', () => { map.getCanvas().style.cursor = 'grabbing'; });
        map.on('dragend',   () => { map.getCanvas().style.cursor = 'default'; });
    }, [handleMapMove]);

    const handleFeatureHover = useCallback(({ object }) => {
        const map = mapRef.current?.getMap?.();
        if (!map) return;
        map.getCanvas().style.cursor = object ? 'pointer' : '';
    }, []);

    // Heatmap Heritage water tint: when the easter egg flips on, recolour
    // every water-fill layer in the Positron style to a desaturated blue-
    // grey that lands on the right "aged paper map" hue after the CSS
    // sepia filter and cream multiply overlay finish compounding on top.
    // Setting the property to null restores the style default on exit.
    //
    // The react-map-gl ref proxies camera methods (flyTo / easeTo / etc.)
    // but NOT style-paint methods, so we have to step through .getMap()
    // to reach the underlying MapLibre instance.
    useEffect(() => {
        const map = mapRef.current?.getMap?.();
        if (!map) return undefined;

        // Picked notably more saturated than the target on-screen blue,
        // because the wrapper's sepia(0.35) filter rotates hues toward
        // yellow-brown AND the cream-paper multiply overlay darkens the
        // result toward parchment. A muted grey-blue here lands grey;
        // we want it to land as clear chambray/steel-blue water that
        // contrasts against the cream land like in the 1974 reference.
        const HERITAGE_WATER = '#3d7aa4';

        // Pick a vintage-typography fontstack we KNOW is loaded on
        // OpenFreeMap's glyph server: scan the style for any italic font
        // it's already using somewhere. If the style ships italic glyphs,
        // we get genuine italic labels with no risk of broken text; if
        // not, we leave fonts alone and rely on letter-spacing + colour.
        const findHeritageFont = (layers) => {
            const seen = new Set();
            for (const l of layers) {
                const fonts = l.layout?.['text-font'];
                if (Array.isArray(fonts)) fonts.forEach(f => seen.add(f));
            }
            return [...seen].find(f => /italic/i.test(f)) ?? null;
        };

        const HERITAGE_TEXT_COLOR = '#3e2723';   // dark espresso — matches header text
        const HERITAGE_HALO_COLOR = '#f4ebd8';   // cream — matches paper overlay
        const HERITAGE_HALO_WIDTH = 1.5;
        const HERITAGE_LETTER_SPACING = 0.15;    // ems — tracked-out, typewriter cadence

        const apply = () => {
            const layers = map.getStyle()?.layers ?? [];
            const heritageFont = heritageMode ? findHeritageFont(layers) : null;

            for (const layer of layers) {
                // --- Water fills ---
                if (layer.type === 'fill' && layer.id.toLowerCase().includes('water')) {
                    if (heritageMode) {
                        if (!(layer.id in originalWaterColors.current)) {
                            originalWaterColors.current[layer.id] =
                                map.getPaintProperty(layer.id, 'fill-color');
                        }
                        map.setPaintProperty(layer.id, 'fill-color', HERITAGE_WATER);
                    } else {
                        const orig = originalWaterColors.current[layer.id];
                        if (orig !== undefined) {
                            map.setPaintProperty(layer.id, 'fill-color', orig);
                        }
                    }
                    continue;
                }

                // --- Text labels (place names, street labels, etc.) ---
                if (layer.type === 'symbol' && layer.layout?.['text-field']) {
                    if (heritageMode) {
                        if (!(layer.id in originalLabelStyles.current)) {
                            originalLabelStyles.current[layer.id] = {
                                font:          map.getLayoutProperty(layer.id, 'text-font'),
                                letterSpacing: map.getLayoutProperty(layer.id, 'text-letter-spacing'),
                                color:         map.getPaintProperty(layer.id, 'text-color'),
                                haloColor:     map.getPaintProperty(layer.id, 'text-halo-color'),
                                haloWidth:     map.getPaintProperty(layer.id, 'text-halo-width'),
                            };
                        }
                        map.setLayoutProperty(layer.id, 'text-letter-spacing', HERITAGE_LETTER_SPACING);
                        map.setPaintProperty(layer.id, 'text-color', HERITAGE_TEXT_COLOR);
                        map.setPaintProperty(layer.id, 'text-halo-color', HERITAGE_HALO_COLOR);
                        map.setPaintProperty(layer.id, 'text-halo-width', HERITAGE_HALO_WIDTH);
                        if (heritageFont) {
                            map.setLayoutProperty(layer.id, 'text-font', [heritageFont]);
                        }
                    } else {
                        const orig = originalLabelStyles.current[layer.id];
                        if (orig) {
                            // Pass undefined back to setXxxProperty to clear our
                            // override and fall back to the style default —
                            // works for any property that wasn't explicitly set
                            // in the original style.
                            map.setLayoutProperty(layer.id, 'text-letter-spacing', orig.letterSpacing);
                            map.setPaintProperty(layer.id, 'text-color', orig.color);
                            map.setPaintProperty(layer.id, 'text-halo-color', orig.haloColor);
                            map.setPaintProperty(layer.id, 'text-halo-width', orig.haloWidth);
                            if (orig.font !== undefined) {
                                map.setLayoutProperty(layer.id, 'text-font', orig.font);
                            }
                        }
                    }
                }
            }
        };

        if (map.isStyleLoaded?.()) {
            apply();
            return undefined;
        }
        // Style not ready yet (typical on first paint) — defer to the
        // next styledata event and clean up the listener if heritageMode
        // changes again before it fires.
        map.once('styledata', apply);
        return () => map.off?.('styledata', apply);
    }, [heritageMode]);

    const foodClusterIndex = useMemo(
        () => buildFoodClusterIndex(foodData, activeFoodCategories),
        [foodData, activeFoodCategories]
    );

    const handleClusterClick = useCallback((cluster) => {
        const map = mapRef.current;
        if (!map || !foodClusterIndex) return;
        const expansionZoom = foodClusterIndex.getClusterExpansionZoom(
            cluster.properties.cluster_id
        );
        map.flyTo({
            center: cluster.geometry.coordinates,
            zoom: Math.min(expansionZoom, MAX_ZOOM),
        });
    }, [foodClusterIndex]);

    // Function to handle the click event for the popups
    const handleClick = useCallback((info, layerId) => {
        //info: the object deck.gl passes to onClick
        //  info.object: the GeoJSON feature that was clicked
        //  info.coordinate: [long, lat] of the click
        if (inPlacementMode) return;
        setSelected({object: info.object, coordinate:info.coordinate, layerId});
        // Send DA data to sidebar and open it
        if (layerId === 'dissemination-areas' && info.object?.properties) {
            setSelectedDA(info.object);
            setSidebarOpen(true);

            // Fly/ Zoom to clicked DA
            const [lng, lat] = info.coordinate;
            const zoom = isDesktop ? 15:14.18;
            const center = isDesktop ? [lng, lat] : [lng, lat - 0.005]; 

            mapRef.current?.easeTo({
                center: center,
                zoom: zoom,
                duration: 1500,
                // Necessary to prevent animation from being skipped
                essential: true, 
            });
        }
        // Send transit stop data to sidebar and open it
        if (layerId === 'transit-stops' && info.object?.properties) {
            setSelectedTransitStop(info.object.properties);
            setSidebarOpen(true);
        }
    }, [inPlacementMode, setSelectedDA, setSelectedTransitStop, setSidebarOpen]);
    
    const handleMapClick = useCallback((info) => {
        if (!inPlacementMode) return;
        if (!info.coordinate) return;
        const [lng, lat] = info.coordinate;
        addPlacedAsset(selectedCategory, lat, lng);
    }, [inPlacementMode, selectedCategory, addPlacedAsset]);

    // When App bumps focusSignal (e.g. loading a saved simulation), fly the
    // camera to the centroid of the placed assets at a close, fixed zoom.
    // Gated on mapLoaded so we don't try to flyTo on a map whose style is
    // still loading (e.g. right after remounting from the account page).
    // We also wait for the next 'idle' event before firing the fly — that
    // way the initial DA recompute + deck.gl layer setup finishes first,
    // so the animation isn't competing for the main thread (otherwise the
    // animation's wall-clock timer ticks while JS is blocked and the fly
    // appears to "jump" near the end).
    // lastFocusedRef tracks the most recent focusSignal we've consumed so
    // unrelated re-renders (placedAssets edits, etc.) don't re-fly.
    useEffect(() => {
        if (!focusSignal) return;
        if (focusSignal === lastFocusedRef.current) return;
        if (!mapLoaded) return;
        if (!placedAssets || placedAssets.length === 0) return;
        const map = mapRef.current;
        if (!map) return;
        lastFocusedRef.current = focusSignal;

        // Centroid of the placed assets.
        let sumLng = 0, sumLat = 0;
        for (const asset of placedAssets) {
            sumLng += asset.lng;
            sumLat += asset.lat;
        }
        const center = [sumLng / placedAssets.length, sumLat / placedAssets.length];

        // Fire once via either path, whichever fires first. The fallback
        // setTimeout guards against the (rare) case where 'idle' never
        // fires within a reasonable window.
        let fired = false;
        const fly = () => {
            if (fired) return;
            fired = true;
            map.flyTo({ center, zoom: 14, duration: 2000, essential: true, curve: 1.42 });
        };
        map.once?.('idle', fly);
        const fallbackId = setTimeout(fly, 1500);

        return () => {
            map.off?.('idle', fly);
            clearTimeout(fallbackId);
        };
    }, [focusSignal, mapLoaded, placedAssets]);

    const LAYERS = useMemo( () => [
        // In Heatmap Heritage mode the DA layer paints the 1974 zoning
        // palette instead of the food-access score colours. The layer
        // stays pickable so info-panel clicks still work.
        getDisseminationAreaLayer({
            data: disseminationData,
            visible: disseminationLayerVisible,
            heritageMode,
            scoreWeights,
            onClick: info => {handleClick(info, 'dissemination-areas')},
            scoreWeights,
            isochroneMinutes,
            }),
        ...(getDAHighlightLayer({
            selectedDA,
            isochroneMinutes,
            visible: disseminationLayerVisible,
        }) ?? []),
        // Transit stops render below food assets/clusters so the food layer
        // stays the visual focus where the two overlap.
        // Food / transit / sim icons vanish in heritage mode — the 1974
        // zoning aesthetic doesn't show modern point overlays. ANDing
        // !heritageMode into the visible flag preserves the user's normal
        // toggle state so the icons return when they exit the easter egg.
        getTransitAssetLayer({
            data: transitData,
            visible: transitLayerVisible && !heritageMode,
            activeRoutes,
            onHover: ({ object }) => {},
            onClick: (info) => handleClick(info, 'transit-stops'),
        }),
        // eslint-disable-next-line react-hooks/refs -- handleClusterClick reads mapRef only when invoked
        ...getFoodAssetLayers({
            index: foodClusterIndex,
            zoom: foodViewport?.zoom,
            bbox: foodViewport?.bbox,
            visible: foodLayerVisible && !heritageMode,
            onHover: handleFeatureHover,
            onClick: ({ object, coordinate }) => {
                if (!object || inPlacementMode) return;
                setSelected({ object, coordinate, layerId: 'food-assets' });
                setSelectedFoodAsset(object.properties);
                setSidebarOpen(true);
            },
            onClusterClick: handleClusterClick,
        }),
        ...getSimAssetLayers({ placedAssets, visible: showSimulation && !heritageMode }),

    ], [foodClusterIndex, foodViewport, foodLayerVisible, handleClusterClick,
        inPlacementMode, transitData, transitLayerVisible, activeRoutes,
        disseminationLayerVisible, disseminationData, handleClick, placedAssets, 
        showSimulation, heritageMode, setSelectedFoodAsset, setSidebarOpen, 
        selectedDA, scoreWeights, isochroneMinutes]);

    // search bar
    const handleAssetSelect = (asset) => {
        if (!asset) return; // user cleared
        // fly the MapLibre camera to the selected asset
        mapRef.current?.flyTo({ center: [asset.lng, asset.lat], zoom: 16 });
        setSelectedFoodAsset(asset);
        setSidebarOpen(true);
    };

    return (
        <div className="w-full h-full relative">

            {/* Map — always rendered */}
            <div className="w-full h-full" style={{ cursor: inPlacementMode ? 'crosshair' : 'default' }}>
                <MapLibre
                    ref={mapRef}
                    initialViewState={{ ...VANCOUVER_CENTER, zoom: DEFAULT_ZOOM }}
                    mapStyle={MAP_STYLE}
                    minZoom={MIN_ZOOM}
                    maxZoom={MAX_ZOOM}
                    onLoad={handleMapLoad}
                    onMove={handleMapMove}
                >
                    {/* Moved to bottom-left so it doesn't sit under the
                        always-visible layer panel pinned to top-right.
                        The previous marginTop:50px hack was there to
                        clear that panel — no longer needed. */}
                    <NavigationControl position="bottom-left" />
                    <DeckGLOverlay layers = {LAYERS} onClick={handleMapClick}/>
                    {/* <LayerPopup id='layer-popup'
                        selected={selected}
                        onClose={() => setSelected(null)}
                    /> */}
                </MapLibre>

            </div>
            {/* Desktop-only chrome */}
            {isDesktop && (
                <>
                    <MapSimButton active={active} setActive={setActive} />
                </>
            )}
            <SearchBar
                onSelect={handleAssetSelect}
                className="absolute top-4 left-4 z-5"
            />

            {/* Map — always rendered */}
            {/* <div className="flex-1 relative"
                 style={{ cursor: inPlacementMode ? 'crosshair' : 'default' }}
            >
                <MapLibre
                    initialViewState={{ ...VANCOUVER_CENTER, zoom: DEFAULT_ZOOM }}
                    mapStyle={MAP_STYLE}
                    minZoom={MIN_ZOOM}
                    maxZoom={MAX_ZOOM}
                >
                    <NavigationControl
                        position="top-right"
                        style={{ marginTop: '50px' }}
                    />
                    
                
                <LayerPopup id='layer-popup'
                    selected={selected}
                    onClose={() => setSelected(null)}
                />
                </MapLibre>
            </div> */}
        </div>
    );
}

export default Map;