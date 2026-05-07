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
import { TestMarker } from './testMarker';
import { useScreenWidth } from '../widthHelper';

export function Map({ active, setActive }) {
    const width = useScreenWidth();
    const isDesktop = width >= 760;

    return (
        <div className="w-full h-full flex flex-col">
            {/* Header — shared, but content differs by breakpoint */}
            <div className="w-full h-16 bg-white shadow-md flex items-center px-6 z-10">
                <h1 className="text-xl font-bold text-gray-700">JohnMap</h1>
            </div>

            {/* Desktop-only chrome */}
            {isDesktop && (
                <>
                    <MapSimButton active={active} setActive={setActive} />
                    <div className="fixed right-0 top-16 flex items-center px-6 z-10 cursor-pointer bg-white shadow-md rounded-bl-lg h-10">
                        <span className="text-gray-500">filters</span>
                    </div>
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
                    <TestMarker />
                </MapLibre>
            </div>
        </div>
    );
}

export default Map;