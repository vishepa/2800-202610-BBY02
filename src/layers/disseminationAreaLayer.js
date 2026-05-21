import { GeoJsonLayer } from '@deck.gl/layers';
import { computeWeightedScore } from '../lib/scoring';
import { getDAZoneColor } from '../lib/heritage';

function getIsochroneScore(properties, isochroneMinutes){
  // applySimulation tags every feature it touches with sim_delta (0 when no
  // asset reaches the DA). Its presence means normalized_da_score has been
  // rewritten by the V3 rerank and should win over the precomputed iso
  // baseline columns; otherwise we're on the raw baseline and the slider
  // picks which precomputed walk-isochrone score to color by.
  if (properties.sim_delta !== undefined) return properties.normalized_da_score ?? 5;
  const key = `walk_${isochroneMinutes}min_score`;
  return properties[key] ?? properties.walk_10min_score ?? 5;
}

function scoreToColor(score, alpha) {
  switch (score){
    case 0:  return [160, 0,  30,  alpha];
    case 1:  return [235, 50,  60,  alpha];
    case 2:  return [220, 70,  40,  alpha];
    case 3:  return [230, 110, 35,  alpha];
    case 4:  return [235, 150, 40,  alpha];
    case 5:  return [245, 200, 80,  alpha];
    case 6:  return [230, 235, 90,  alpha];
    case 7:  return [190, 230, 100, alpha];
    case 8:  return [120, 210, 100, alpha];
    case 9:  return [40,  190, 80,  alpha];
    case 10: return [0,   210, 60,  alpha];
    default: return [180, 180, 180, alpha];
  }
}

export function getDisseminationAreaLayer({ data, visible = true, onClick, scoreWeights, isochroneMinutes, heritageMode = false } = {}) {
   return new GeoJsonLayer({
    id: 'dissemination-areas',
    data,
    filled: true,
    getFillColor: heritageMode
      ? f => getDAZoneColor(f.properties?.dauid, 210)
      : f => scoreToColor(getIsochroneScore(f.properties, isochroneMinutes), 80),
    stroked: true,
    // Darker, thinner pixel-unit borders in heritage mode so adjacent
    // zones read with the same hand-printed weight as the reference map.
    getLineColor: heritageMode ? [78, 52, 36, 220] : [128, 128, 128],
    getLineWidth: heritageMode ? 1.5 : 3,
    lineWidthUnits: heritageMode ? 'pixels' : 'meters',
    pickable: true,
    visible,
    onClick,
    updateTriggers: {
      getFillColor: [data, scoreWeights, heritageMode, isochroneMinutes],
      getLineColor: [heritageMode],
      getLineWidth: [heritageMode],
    },
  });
}

export function getDAHighlightLayer({ visible = true, selectedDA, isochroneMinutes } = {}) {
  if (!selectedDA) return null;

  const highlightData = {type: 'FeatureCollection', features:[selectedDA]};
  const isoScore = getIsochroneScore(selectedDA.properties, isochroneMinutes);
  const [r, g, b] = scoreToColor(isoScore, 255);

  return [
    new GeoJsonLayer({
      id: 'dissemination-highlight-glow',
      data: highlightData,
      filled: false,
      stroked: true,
      getLineColor: [r, g, b, 140],
      getLineWidth: 14,
      lineWidthUnits: 'pixels',
      pickable: false,
      visible,
    }),
    new GeoJsonLayer({
      id: 'dissemination-highlight-fill',
      data: highlightData,
      filled: true,
      getFillColor: [r, g, b, 60],
      stroked: true,
      getLineColor: [r, g, b, 240],
      getLineWidth: 3,
      lineWidthUnits: 'pixels',
      pickable: false,
      visible,
    }),
  ];
}
