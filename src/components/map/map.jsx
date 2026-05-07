import MapSimButton from "../MapSimButton";
import 'maplibre-gl/dist/maplibre-gl.css';
import MapLibre, { NavigationControl } from 'react-map-gl/maplibre';
import {
    VANCOUVER_CENTER,
    DEFAULT_ZOOM,
    MIN_ZOOM,
    MAX_ZOOM,
    MAP_STYLE
} from '../../constants/mapDefaults';

// import { TestMarker } from './testMarker'; // TODO: Remove once real food asset markers are wired up (Halie's deck.gl work).

import { useMemo, useState, useCallback } from 'react';
import DeckGLOverlay  from './DeckGLOverlay';
import { getTestLayer } from '../../layers/TestLayer';
import { getFoodAssetLayer } from '../../layers/foodAssetLayer';
import { useFoodAssets } from '../../lib/hooks/useFoodAssets';

import FoodTypeFilter from "../FoodTypeFilter";
import { getDisseminationAreaLayer } from '../../layers/DisseminationAreaLayer.js';
import {LayerPopup} from './popups/LayerPopup';
// import TestMarker from "testMarker";

export function Map({ active, setActive }) {

    const { data: foodData } = useFoodAssets();
    const [foodLayerVisible, setFoodLayerVisible] = useState(true);
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

    const LAYERS = useMemo(() => [
        getTestLayer(),
        getDisseminationAreaLayer(info => handleClick(info, 'dissemination-areas')),
        getFoodAssetLayer({
            data: foodData,
            visible: foodLayerVisible,
            activeCategories: activeFoodCategories,
            onHover: ({ object, x, y }) => {/* sidebar update - add later */},
            onClick: ({ object }) => console.log('Clicked on food asset:', object),
        }),
    ], [foodData, foodLayerVisible, activeFoodCategories]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="w-full h-16 bg-white shadow-md flex items-center px-6 z-10">
        <h1 className="text-xl font-bold text-gray-700">JohnMap</h1>
      </div>

      <MapSimButton active={active} setActive={setActive} /> {/* Simulation mode toggle */}

            {/* Filters button should be attached to the header.*/}
            <div className="fixed right-0 top-16 flex items-center px-6 z-10 cursor-pointer bg-white shadow-md rounded-bl-lg h-10">
                <span className="text-gray-500">filters</span>

            </div>
            {/* DELETE THIS GANG, JUST HERE FOR TESTING */}
                <div className="absolute top-16 right-32 z-10 space-y-2">
                    <button
                        onClick={() => setFoodLayerVisible(v => !v)}
                        className="bg-white shadow-md rounded px-3 py-2"
                    >
                        {foodLayerVisible ? 'Hide food assets' : 'Show food assets'}
                    </button>
                    <FoodTypeFilter
                        activeCategories={activeFoodCategories}
                        onChange={setActiveFoodCategories}
                    />

                </div>
            
            {/* Map content */}
            <div className="flex-1 relative">
                <MapLibre
                    initialViewState={{ ...VANCOUVER_CENTER, zoom: DEFAULT_ZOOM }}
                    mapStyle={MAP_STYLE}
                    minZoom={MIN_ZOOM}
                    maxZoom={MAX_ZOOM}
                >
                    <NavigationControl
                        position="top-right" 
                        style={{ marginTop: '50px'}}
                    />
                    
                    <DeckGLOverlay layers = {LAYERS} interleaved />
                
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
