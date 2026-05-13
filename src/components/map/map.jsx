import MapSimButton from "./MapSimButton";
import 'maplibre-gl/dist/maplibre-gl.css';
import MapLibre, { NavigationControl } from 'react-map-gl/maplibre';
import {
    VANCOUVER_CENTER,
    DEFAULT_ZOOM,
    MIN_ZOOM,
    MAX_ZOOM,
    MAP_STYLE
} from '../../constants/mapDefaults';
// import { TestMarker } from './testMarker';
import { useScreenWidth } from '../shared/widthHelper.jsx';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import DeckGLOverlay  from './DeckGLOverlay';
// import { getTestLayer } from '../../layers/TestLayer';
import { getFoodAssetLayer } from '../../layers/FoodAssetLayer';
import { getTransitAssetLayer } from '../../layers/TransitLayer.js';

import { useTransitStops } from '../../lib/hooks/useTransitStops.js';
import { useFoodAssets } from '../../lib/hooks/useFoodAssets';

import FoodTypeFilter from "./FoodTypeFilter.jsx";
import { getDisseminationAreaLayer } from '../../layers/DisseminationAreaLayer.js';
import {LayerPopup} from './popups/LayerPopup.jsx';



export function Map({
    active, 
    setActive,
    foodLayerVisible,
    transitLayerVisible,
    disseminationLayerVisible,

}) {
    
    // Data fetching hooks
    const { data: foodData } = useFoodAssets();
    const { data: transitData } = useTransitStops();

    const [activeRoutes, setActiveRoutes] = useState(null);

    const [activeFoodCategories, setActiveFoodCategories] = useState(null); // null means "all types" 

    // Selected state for the popups
    const [selected, setSelected] = useState(null);

    // Function to handle the click event for the popups
    const handleClick = useCallback((info, layerId) => {
        //info: the object deck.gl passes to onClick
        //  info.object: the GeoJSON feature that was clicked
        //  info.coordinate: [long, lat] of the click
        console.log("LeftClick working");
        setSelected({object: info.object, coordinate:info.coordinate, layerId});
    }, []); 

    const LAYERS = useMemo( () => [
        // getTestLayer(),
        getDisseminationAreaLayer({
            
            visible: disseminationLayerVisible,
            onClick: info => handleClick(info, 'dissemination-areas'),

            }),
        getFoodAssetLayer({
            data: foodData,
            visible: foodLayerVisible,
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

    ], [foodData, foodLayerVisible, activeFoodCategories, transitData, transitLayerVisible, activeRoutes, disseminationLayerVisible]);

    const width = useScreenWidth();
    const isDesktop = width >= 760;

    return (
        <div className="w-full h-full flex flex-col">
            {/* Desktop-only chrome */}
            {isDesktop && (
                <>
                    <MapSimButton active={active} setActive={setActive} />
                </>
            )}

            {/* Map — always rendered */}
            <div className="flex-1 relative">
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
                    
                    <DeckGLOverlay layers = {LAYERS}/>
                
                <LayerPopup id='layer-popup'
                    selected={selected}
                    onClose={() => setSelected(null)}
                />
                </MapLibre>
            </div>
        </div>
    );
}

export default Map;