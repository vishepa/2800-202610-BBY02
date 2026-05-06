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

import { useMemo, useState } from 'react';
import DeckGLOverlay  from './DeckGLOverlay';
import { getTestLayer } from '../../layers/TestLayer';
import { getFoodAssetLayer } from '../../layers/foodAssetLayer';
import { useFoodAssets } from '../../lib/hooks/useFoodAssets';

import FoodTypeFilter from "../FoodTypeFilter";

export function Map({ active, setActive }) {

    const { data: foodData } = useFoodAssets();
    const [foodLayerVisible, setFoodLayerVisible] = useState(true);
    const [activeFoodTypes, setActiveFoodTypes] = useState(null); // null means "all types" 


    const layers = useMemo(() => [
        getTestLayer(),
        getFoodAssetLayer({
            data: foodData,
            visible: foodLayerVisible,
            activeTypes: activeFoodTypes,
            onHover: ({ object, x, y }) => {/* sidebar update - add later */},
            onClick: ({ object }) => console.log('Clicked on food asset:', object),
        }),
    ], [foodData, foodLayerVisible, activeFoodTypes]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="w-full h-16 bg-white shadow-md flex items-center px-6 z-10">
        <h1 className="text-xl font-bold text-gray-700">JohnMap</h1>
      </div>

      <MapSimButton active={active} setActive={setActive} /> {/* 👈 */}

            {/* Filters button should be attached to the header.*/}
            <div className="fixed right-0 top-16 flex items-center px-6 z-10 cursor-pointer bg-white shadow-md rounded-bl-lg h-10">
                <span className="text-gray-500">filters</span>

            </div>
                <div>
                    <FoodTypeFilter
                        activeTypes={activeFoodTypes}
                        onChange={setActiveFoodTypes}
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
                    {/* <TestMarker /> TODO: Remove once real food asset markers are wired up (Halie's deck.gl work).    */}

                    <DeckGLOverlay layers = {layers} />
                </MapLibre>
                        
            </div>

        </div>
    );
}
export default Map;
