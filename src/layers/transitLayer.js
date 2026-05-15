import { ScatterplotLayer } from "@deck.gl/layers";




export function getTransitAssetLayer({
    data,
    visible = true,
    activeRoutes = null,
    onHover,
    onClick,
}) {

    const features = data?.features ?? [];  

    const validFeatures = features.filter(f =>
        f.geometry?.coordinates &&
        Array.isArray(f.properties.routes) &&
        f.properties.routes.length > 0
    );



    const filteredFeatures = activeRoutes
        ? validFeatures.filter(f => f.properties.routes.some(r => activeRoutes.includes(r)))
        : validFeatures;

        return new ScatterplotLayer({
            id: 'transit-stops',
            data: filteredFeatures,
            visible,

            getPosition: f => f.geometry.coordinates,

            getRadius: 18,
            radiusUnits: 'meters',
            radiusMinPixels: 1,
            radiusMaxPixels: 7,

            getFillColor: [37, 99, 235, 200],
            getLineColor: [255, 255, 255, 220],
            lineWidthMinPixels: 1,
            stroked: true,
            filled: true,

            pickable: true,
            onHover,
            onClick,
 
        });
}
