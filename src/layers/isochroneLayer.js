import { GeoJsonLayer } from "@deck.gl/layers";

/** Seconds → [R, G, B, A] — ordered outermost to innermost */
const RANGE_COLORS = {
  900: [56,  189, 248, 10],   // sky-400    — 15 min
  600: [99,  102, 241, 20],   // indigo-500 — 10 min
  300: [168, 85,  247, 30],  // violet-500 — 5 min
};

// export function getIsochroneLayer({ data, activeRanges = [300, 600, 900] }) {
//   if (!data?.features) return null; // guard against null/loading state
//   const visibleFeatures = data.features.filter((f) =>
//     activeRanges.includes(f.properties.range_seconds)
//   );

//   return new GeoJsonLayer({
//     id: "isochrones",
//     data: visibleFeatures,

//     getFillColor: (f) => RANGE_COLORS[f.properties.range_seconds] ?? [255, 255, 255, 40],
//     getLineColor: (f) => {
//       const [r, g, b] = RANGE_COLORS[f.properties.range_seconds] ?? [255, 255, 255];
//       return [r, g, b, 200];
//     },

//     stroked: true,
//     getLineWidth: 1,
//     lineWidthUnits: "pixels",
//     filled: true,

//     getPolygonOffset: (f) => [0, -(f.properties.range_seconds / 100)],

//     pickable: false, // no hover/click needed

//     updateTriggers: {
//       getFillColor: [activeRanges],
//       getLineColor: [activeRanges],
//     },
//   });
// }

export function getIsochroneLayer({ data, activeRanges = [300, 600, 900] }) {
  if (!data?.features) return null;

  const visibleFeatures = data.features.filter((f) =>
    f.properties && activeRanges.includes(f.properties.range_seconds)
  );

  return new GeoJsonLayer({
    id: "isochrones",
    data: {
      type: "FeatureCollection",
      features: visibleFeatures,
    },

    getFillColor: (f) => RANGE_COLORS[f.properties?.range_seconds] ?? [255, 255, 255, 40],
    getLineColor: (f) => {
      const [r, g, b] = RANGE_COLORS[f.properties?.range_seconds] ?? [255, 255, 255];
      return [r, g, b, 200];
    },

    stroked: true,
    getLineWidth: 1,
    lineWidthUnits: "pixels",
    filled: true,
    pickable: false,
    parameters: {
      blendFunc: [WebGLRenderingContext.ONE, WebGLRenderingContext.ONE_MINUS_SRC_ALPHA],
      blendEquation: WebGLRenderingContext.FUNC_ADD,
    },

    updateTriggers: {
      getFillColor: [activeRanges],
      getLineColor: [activeRanges],
    },
  });
}