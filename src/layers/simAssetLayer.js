import { IconLayer } from "@deck.gl/layers";
import { getFoodCategorySimPin } from "../constants/foodCategories";

/**
 * Returns two layers: a blue ring underneath, and the category icon on top.
 * Visually distinguishes hypothetical (placed) assets from real food assets.
 *
 * placedAssets shape: [{ id, category, lat, lng }]
 */
export function getSimAssetLayers({ placedAssets, visible = true } = {}) {

    const iconLayer = new IconLayer({
        id: 'sim-assets',
        data: placedAssets,
        visible,
        getPosition: a => [a.lng, a.lat],
        getIcon: a => ({
            url: getFoodCategorySimPin(a.category) || DEFAULT_ICON,
            width: 100,
            height: 100,
            anchorY: 128,
        }),
        // Slightly larger than real food assets (32) so the hierarchy
        // pulls the eye to the placed simulation icons.
        getSize: 48,
        sizeUnits: 'pixels',
        pickable: true,
    });

    return [iconLayer];
}