import { GeoJsonLayer } from '@deck.gl/layers';

function scoreToColor(feature, alpha) {
  switch (feature.properties.normalized_da_score) {
    case 1:  return [64,  11,  16,  alpha];
    case 2:  return [122, 17,  14,  alpha];
    case 3:  return [185, 40,  30,  alpha];
    case 4:  return [220, 90,  40,  alpha];
    case 5:  return [240, 160, 60,  alpha];
    case 6:  return [254, 241, 150, alpha];
    case 7:  return [180, 220, 120, alpha];
    case 8:  return [100, 190, 100, alpha];
    case 9:  return [0,   124, 77,  alpha];
    case 10: return [0,   59,  46,  alpha];
    default: return [180, 180, 180, alpha];
  }
}

export function getDisseminationAreaLayer({ data, visible = true, onClick } = {}) {
  return new GeoJsonLayer({
    id: 'dissemination-areas',
    data,
    filled: true,
    getFillColor: (feature) => scoreToColor(feature, 60),
    stroked: true,
    getLineColor: [128, 128, 128], //(feature) => scoreToColor(feature, 255),
    getLineWidth: 3,
    pickable: true,
    visible,
    onClick,
    updateTriggers: {
      getFillColor: [data],
      getLineColor: [data],
    },
  });
}
