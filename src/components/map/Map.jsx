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
import { getFoodAssetLayer } from '../../layers/foodAssetLayer';
import { getTransitAssetLayer } from '../../layers/transitLayer.js';
import { getSimAssetLayers } from "../../layers/SimAssetLayer.js";

import { useTransitStops } from '../../lib/hooks/useTransitStops.js';
import { useFoodAssets } from '../../lib/hooks/useFoodAssets';

import FoodTypeFilter from "./FoodTypeFilter.jsx";
import { getDisseminationAreaLayer } from '../../layers/disseminationAreaLayer.js';
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
    placedAssets,
    addPlacedAsset,
    selectedDA,
    setSelectedDA,
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
    const inPlacementMode = active === "sim" && selectedCategory !== null;

    const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
    const handleMapMove = useCallback(() => {
        const m = mapRef.current;
        if (m) setMapZoom(m.getZoom());
    }, []);

    // Function to handle the click event for the popups
    const handleClick = useCallback((info, layerId) => {
        //info: the object deck.gl passes to onClick
        //  info.object: the GeoJSON feature that was clicked
        //  info.coordinate: [long, lat] of the click
        if (inPlacementMode) return;
        console.log("LeftClick working");
        setSelected({object: info.object, coordinate:info.coordinate, layerId});
        // Send DA data to sidebar and open it
        if (layerId === 'dissemination-areas' && info.object?.properties) {
            setSelectedDA(info.object.properties);
            setSidebarOpen(true);
        }
    }, [inPlacementMode, setSelectedDA, setSidebarOpen]);
    
    const handleMapClick = useCallback((info) => {
        if (!inPlacementMode) return;
        if (!info.coordinate) return;
        const [lng, lat] = info.coordinate;
        addPlacedAsset(selectedCategory, lat, lng);
    }, [inPlacementMode, selectedCategory, addPlacedAsset]);

    const LAYERS = useMemo( () => [
        // getTestLayer(),
        getDisseminationAreaLayer({
            data: disseminationData,
            visible: disseminationLayerVisible,
            onClick: info => handleClick(info, 'dissemination-areas'),
            }),
        getFoodAssetLayer({
            data: foodData,
            visible: foodLayerVisible,
            zoom: mapZoom,
            activeCategories: activeFoodCategories,
            onHover: ({ object, x, y }) => {/* sidebar update - add later */},
            onClick: ({ object }) => console.log('Clicked on food asset:', object),
        }),
        getTransitAssetLayer({
            data: transitData,
            visible: transitLayerVisible,
            activeRoutes,
            onHover: ({ object }) => {},
            onClick: (info) => handleClick(info, 'transit-stops'),
        }),
        ...getSimAssetLayers({ placedAssets }),

    ], [foodData, foodLayerVisible, mapZoom, activeFoodCategories, transitData, transitLayerVisible, activeRoutes, disseminationLayerVisible, disseminationData, handleClick, placedAssets]);

    // search bar
    const handleAssetSelect = (asset) => {
        if (!asset) return; // user cleared
        // fly the MapLibre camera to the selected asset
        mapRef.current?.flyTo({ center: [asset.lng, asset.lat], zoom: 16 });
        // optionally update a deck.gl highlight layer
    };

    const width = useScreenWidth();
    const isDesktop = width >= 760;

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