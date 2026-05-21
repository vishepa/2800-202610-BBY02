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

    const LAYERS = useMemo( () => [
        getDisseminationAreaLayer({
            data: disseminationData,
            visible: disseminationLayerVisible,
            onClick: info => {handleClick(info, 'dissemination-areas')},
            scoreWeights,
        }),
        // getDAHighlightLayer returns an array of layers (glow + fill) or
        // null — spread with a null-safe fallback to flatten into LAYERS.
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
        showSimulation, setSelectedFoodAsset, setSidebarOpen, selectedDA, scoreWeights]);

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
                    onLoad={handleMapMove}
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