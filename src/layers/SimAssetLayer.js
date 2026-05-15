import { IconLayer, ScatterplotLayer } from "@deck.gl/layers";

// Same icon URLs as foodAssetLayer / IconPicker. Refactor to shared
// constants once real icons land.
const ICON_URLS = {
    'Grocery Stores':       'https://cdn-icons-png.flaticon.com/512/3724/3724788.png',
    'Supermarkets':         'https://cdn-icons-png.flaticon.com/512/3724/3724788.png',
    'Commissary Kitchens':  'https://cdn-icons-png.flaticon.com/512/10630/10630027.png',
    'Kitchen Access':       'https://cdn-icons-png.flaticon.com/512/2728/2728879.png',
    'Community Gardens':    'https://cdn-icons-png.flaticon.com/512/628/628324.png',
    'Free Meal':            'https://cdn-icons-png.flaticon.com/512/6188/6188570.png',
    'Low Cost Meal':        'https://cdn-icons-png.flaticon.com/512/1027/1027943.png',
};

const DEFAULT_ICON = 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png';

/**
 * Returns two layers: a blue ring underneath, and the category icon on top.
 * Visually distinguishes hypothetical (placed) assets from real food assets.
 *
 * placedAssets shape: [{ id, category, lat, lng }]
 */
export function getSimAssetLayers({ placedAssets, visible = true } = {}) {
    const ringLayer = new ScatterplotLayer({
        id: 'sim-asset-rings',
        data: placedAssets,
        visible,
        getPosition: a => [a.lng, a.lat],
        // Filled blue disc — the icon on top will hide most of it,
        // leaving a visible ring around the icon.
        getFillColor: [37, 99, 235, 200], // blue-600 with alpha
        getRadius: 20,
        radiusUnits: 'pixels',
        stroked: false,
        pickable: false,
    });

    const iconLayer = new IconLayer({
        id: 'sim-assets',
        data: placedAssets,
        visible,
        getPosition: a => [a.lng, a.lat],
        getIcon: a => ({
            url: ICON_URLS[a.category] || DEFAULT_ICON,
            width: 100,
            height: 100,
            anchorY: 128,
        }),
        // Slightly larger than real food assets (32) so the hierarchy
        // pulls the eye to the placed simulation icons.
        getSize: 36,
        sizeUnits: 'pixels',
        pickable: true,
    });

    return [ringLayer, iconLayer];
}