// TODO: Remove once real food asset markers are wired up (Halie's deck.gl work).
// This file proves the Marker → state → Popup pattern works against react-map-gl.

import { useState } from 'react';
import { Marker, Popup } from 'react-map-gl/maplibre';

const TEST_POINT = {
    longitude: -123.1207,
    latitude: 49.2827,
    name: 'Test marker — Vancouver',
    details: 'Hardcoded sample point. Remove before merge to main.',
};

export function TestMarker() {
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    return (
        <>
            <Marker
                longitude={TEST_POINT.longitude}
                latitude={TEST_POINT.latitude}
                onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setIsPopupOpen(true);
                }}
            />

            {isPopupOpen && (
                <Popup
                    longitude={TEST_POINT.longitude}
                    latitude={TEST_POINT.latitude}
                    onClose={() => setIsPopupOpen(false)}
                    closeOnClick={true}
                    anchor="bottom"
                >
                    <div>
                        <strong>{TEST_POINT.name}</strong>
                        <p>{TEST_POINT.details}</p>
                    </div>
                </Popup>
            )}
        </>
    );
}