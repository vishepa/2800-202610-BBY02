import { IconLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import Supercluster from "supercluster";
import { FOOD_CATEGORY_IDS, getFoodCategoryMapPin } from "../constants/foodCategories";

const CLUSTER_OPTIONS = {
    radius: 60,
    maxZoom: 16,
    minPoints: 2,
};

const CLUSTER_ZOOM_THRESHOLD = 13;

export function buildFoodClusterIndex(data, activeCategories) {
    const features = data?.features ?? [];
    const valid = features.filter(f =>
        f.geometry?.coordinates &&
        FOOD_CATEGORY_IDS.includes(f.properties.category)
    );
    const filtered = activeCategories
        ? valid.filter(f => activeCategories.includes(f.properties.category))
        : valid;

    const index = new Supercluster(CLUSTER_OPTIONS);
    index.load(filtered);
    return index;
}

export function getFoodAssetLayers({
    index,
    zoom,
    bbox,
    visible = true,
    onHover,
    onClick,
    onClusterClick,
    clusterZoomThreshold = CLUSTER_ZOOM_THRESHOLD,
} = {}) {
    if (!index || !bbox || zoom == null) return [];

    const effectiveZoom = zoom >= clusterZoomThreshold
        ? CLUSTER_OPTIONS.maxZoom + 1  // +1 pushes past maxZoom so no clusters form
        : Math.floor(zoom);

    const clusters = index.getClusters(bbox, effectiveZoom);
    
    // const clusters = index.getClusters(bbox, Math.floor(zoom));
    const clusterFeatures = [];
    const pointFeatures = [];
    for (const c of clusters) {
        (c.properties.cluster ? clusterFeatures : pointFeatures).push(c);
    }

    // Points that share a location stack exactly and hide each other. Fan
    // any such group out by a few pixels so every icon stays visible.
    const pixelOffsets = computeSpreadOffsets(pointFeatures);

    const iconLayer = new IconLayer({
        id: 'food-assets',
        data: pointFeatures,
        visible,
        getPosition: f => f.geometry.coordinates,
        getIcon: f => ({
            url: getFoodCategoryMapPin(f.properties.category),
            width: 100,
            height: 100,
            anchorY: 128,
        }),
        getSize: 48,
        sizeUnits: 'pixels',
        getPixelOffset: (f, { index: i }) => pixelOffsets[i],
        pickable: true,
        onHover,
        onClick,
    });

    const clusterCircles = new ScatterplotLayer({
        id: 'food-asset-clusters',
        data: clusterFeatures,
        visible,
        getPosition: c => c.geometry.coordinates,
        getRadius: c => 14 + Math.min(20, Math.log10(c.properties.point_count) * 10),
        radiusUnits: 'pixels',
        getFillColor: [37, 99, 235, 220],
        getLineColor: [255, 255, 255, 255],
        stroked: true,
        lineWidthUnits: 'pixels',
        getLineWidth: 2,
        pickable: true,
        onClick: info => {
            if (info.object && onClusterClick) onClusterClick(info.object);
        },
    });

    const clusterLabels = new TextLayer({
        id: 'food-asset-cluster-labels',
        data: clusterFeatures,
        visible,
        getPosition: c => c.geometry.coordinates,
        getText: c => String(c.properties.point_count_abbreviated ?? c.properties.point_count),
        getSize: 14,
        sizeUnits: 'pixels',
        getColor: [255, 255, 255, 255],
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'center',
        pickable: false,
    });

    return [iconLayer, clusterCircles, clusterLabels];
}

// Groups features by rounded coordinate (~1m precision) and returns a
// per-feature [x, y] pixel offset. Solo points get [0, 0]; coincident
// points are fanned evenly around a small circle.
function computeSpreadOffsets(features) {
    const FAN_RADIUS = 14; // pixels
    const groups = new Map();
    features.forEach((f, i) => {
        const [lng, lat] = f.geometry.coordinates;
        const key = `${lng.toFixed(5)},${lat.toFixed(5)}`;
        const group = groups.get(key);
        if (group) group.push(i);
        else groups.set(key, [i]);
    });

    const offsets = new Array(features.length).fill(null).map(() => [0, 0]);
    for (const indices of groups.values()) {
        if (indices.length < 2) continue;
        indices.forEach((featureIndex, k) => {
            const angle = (2 * Math.PI * k) / indices.length;
            offsets[featureIndex] = [
                Math.round(FAN_RADIUS * Math.cos(angle)),
                Math.round(FAN_RADIUS * Math.sin(angle)),
            ];
        });
    }
    return offsets;
}

