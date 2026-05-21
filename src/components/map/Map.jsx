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
// import { TestMarker } from './testMarker';
import { useScreenWidth } from '../shared/widthHelper.jsx';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import DeckGLOverlay  from './DeckGLOverlay';
// import { getTestLayer } from '../../layers/TestLayer';
import { getFoodAssetLayers, buildFoodClusterIndex } from '../../layers/foodAssetLayer';
import { getTransitAssetLayer } from '../../layers/transitLayer.js';
import { getSimAssetLayers } from "../../layers/SimAssetLayer.js";

import { useTransitStops } from '../../lib/hooks/useTransitStops.js';
import { useFoodAssets } from '../../lib/hooks/useFoodAssets';

import FoodTypeFilter from "./FoodTypeFilter.jsx";
import { getDisseminationAreaLayer, getDAHighlightLayer } from '../../layers/disseminationAreaLayer.js';
import {LayerPopup} from './popups/LayerPopup.jsx';
import SearchBar from "./SearchBar";
// import TestMarker from "testMarker";



export function Map({
    active,
    setActive,
    foodLayerVisible,
    transitLayerVisible,
    disseminationLayerVisible,
    disseminationData,
    selectedCategory,
    scoreWeights,
    placedAssets,
    addPlacedAsset,
    showSimulation,
    focusSignal,
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

    const [activeFoodCategories, setActiveFoodCategories] = useState(null); // null means "all types" 

    // Selected state for the popups
    const [selected, setSelected] = useState(null);

    const mapRef = useRef(null);
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
        const m = mapRef.current;
        if (!m) return;
        const b = m.getBounds();
        setFoodViewport({
            zoom: m.getZoom(),
            bbox: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
        });
    }, []);

    const handleMapLoad = useCallback(() => {
        setMapLoaded(true);
        handleMapMove();
    }, [handleMapMove]);

    const foodClusterIndex = useMemo(
        () => buildFoodClusterIndex(foodData, activeFoodCategories),
        [foodData, activeFoodCategories]
    );

    const handleClusterClick = useCallback((cluster) => {
        const m = mapRef.current;
        if (!m || !foodClusterIndex) return;
        const expansionZoom = foodClusterIndex.getClusterExpansionZoom(
            cluster.properties.cluster_id
        );
        m.flyTo({
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
        const m = mapRef.current;
        if (!m) return;
        lastFocusedRef.current = focusSignal;

        // Centroid of the placed assets.
        let sumLng = 0, sumLat = 0;
        for (const a of placedAssets) {
            sumLng += a.lng;
            sumLat += a.lat;
        }
        const center = [sumLng / placedAssets.length, sumLat / placedAssets.length];

        // Fire once via either path, whichever fires first. The fallback
        // setTimeout guards against the (rare) case where 'idle' never
        // fires within a reasonable window.
        let fired = false;
        const fly = () => {
            if (fired) return;
            fired = true;
            m.flyTo({ center, zoom: 14, duration: 2000, essential: true, curve: 1.42 });
        };
        m.once?.('idle', fly);
        const fallbackId = setTimeout(fly, 1500);

        return () => {
            m.off?.('idle', fly);
            clearTimeout(fallbackId);
        };
    }, [focusSignal, mapLoaded, placedAssets]);

    const LAYERS = useMemo( () => [
        getDisseminationAreaLayer({
            data: disseminationData,
            visible: disseminationLayerVisible,
            onClick: info => {handleClick(info, 'dissemination-areas')},
            scoreWeights,
            }),
        ...(getDAHighlightLayer({
            selectedDA,
            visible: disseminationLayerVisible,
        }) ?? []),
        // Transit stops render below food assets/clusters so the food layer
        // stays the visual focus where the two overlap.
        getTransitAssetLayer({
            data: transitData,
            visible: transitLayerVisible,
            activeRoutes,
            onHover: ({ object }) => {},
            onClick: (info) => handleClick(info, 'transit-stops'),
        }),
        // eslint-disable-next-line react-hooks/refs -- handleClusterClick reads mapRef only when invoked
        ...getFoodAssetLayers({
            index: foodClusterIndex,
            zoom: foodViewport?.zoom,
            bbox: foodViewport?.bbox,
            visible: foodLayerVisible,
            onHover: ({ object, x, y }) => {/* sidebar update - add later */},
            onClick: ({ object, coordinate }) => {
                if (!object || inPlacementMode) return;
                setSelected({ object, coordinate, layerId: 'food-assets' });
                setSelectedFoodAsset(object.properties);
                setSidebarOpen(true);
            },
            onClusterClick: handleClusterClick,
        }),
        ...getSimAssetLayers({ placedAssets, visible: showSimulation }),

    ], [foodClusterIndex, foodViewport, foodLayerVisible, handleClusterClick, 
        inPlacementMode, transitData, transitLayerVisible, activeRoutes,
        disseminationLayerVisible, disseminationData, handleClick, placedAssets, 
        showSimulation, setSelectedFoodAsset, setSidebarOpen, 
        selectedDA, scoreWeights]);

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
                    <NavigationControl
                        position="top-right"
                        style={{ marginTop: '50px' }}
                    />
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
                className="absolute top-4 left-4 z-10"
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