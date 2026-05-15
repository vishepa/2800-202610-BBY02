import { IconLayer } from "@deck.gl/layers";
import { FOOD_CATEGORY_IDS } from "../constants/foodCategories";




export function getFoodAssetLayer({
    data,
    visible = true, 
    activeCategories = null,
    onHover,
    onClick,
}) { 

    const features = data?.features ?? [];  

    // Makes the markers only render if their category matches with one from foodCategories.js.
    const validFeatures = features.filter(f =>
        f.geometry?.coordinates &&
        FOOD_CATEGORY_IDS.includes(f.properties.category)
    );



    const filteredFeatures = activeCategories
        ? validFeatures.filter(f => activeCategories.includes(f.properties.category))
        : validFeatures;

        return new IconLayer({
            id: 'food-assets',
            data: filteredFeatures,
            visible,

            getPosition: f => f.geometry.coordinates,

            // TODO: Replace with real icons once we have them.
            getIcon: f => ({
                url: getIconUrlForCategory(f.properties.category),
                width: 100,
                height: 100,
                anchorY: 128,
            }),

            getSize: 32,
            sizeUnits: 'pixels',

            pickable: true,
            onHover,
            onClick,

        });
}

function getIconUrlForCategory(category) {
    const icons = {
    'Grocery Stores':       'https://cdn-icons-png.flaticon.com/512/3724/3724788.png',
    'Supermarkets':       'https://cdn-icons-png.flaticon.com/512/3724/3724788.png',
    'Specialty Food Stores':       'https://cdn-icons-png.flaticon.com/512/3724/3724788.png',
    'Commissary Kitchens':        'https://cdn-icons-png.flaticon.com/512/10630/10630027.png',
    'Kitchen Access':        'https://cdn-icons-png.flaticon.com/512/2728/2728879.png',
    'Community Gardens':  'https://cdn-icons-png.flaticon.com/512/628/628324.png',
    'Free Meal':         'https://cdn-icons-png.flaticon.com/512/6188/6188570.png',
    'Low Cost Meal':     'https://cdn-icons-png.flaticon.com/512/1027/1027943.png',
    };
    return icons[category] || 'https://cdn-icons-png.flaticon.com/512/3334/3334886.png'; // Default icon
}