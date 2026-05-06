import 'maplibre-gl/dist/maplibre-gl.css';
import MapLibre, { NavigationControl } from 'react-map-gl/maplibre';
import {
    VANCOUVER_CENTER,
    DEFAULT_ZOOM,
    MIN_ZOOM,
    MAX_ZOOM,
    MAP_STYLE
} from '../../constants/mapDefaults';

import { TestMarker } from './testMarker'; // TODO: Remove once real food asset markers are wired up (Halie's deck.gl work).




export function Map() {
    return (
        <div className="w-full h-full flex flex-col">

            {/* Header */}
            <div className="w-full h-16 bg-white shadow-md flex items-center px-6 z-10">
                <h1 className="text-xl font-bold text-gray-700">JohnMap</h1>
            </div>

            {/* The map/sim buttons at the top middle of the screen below the header.*/}
            <div className="fixed top-16 flex items-center px-6 z-10 bg-white shadow-md rounded-b-lg h-10 left-1/2 -translate-x-1/2">
                <button className="text-black px-4 py-2 rounded cursor-pointer">Map</button>
                <h2>|</h2>
                <button className="text-black px-4 py-2 rounded cursor-pointer">Sim</button>
            </div>

            {/* Filters button should be attached to the header.*/}
            <div className="fixed right-0 top-16 flex items-center px-6 z-10 cursor-pointer bg-white shadow-md rounded-bl-lg h-10">
                <span className="text-gray-500">filters</span>
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
                    <TestMarker /> {/* TODO: Remove once real food asset markers are wired up (Halie's deck.gl work). */}   
                </MapLibre>
                        
            </div>

        </div>
    );
}
export default Map;
