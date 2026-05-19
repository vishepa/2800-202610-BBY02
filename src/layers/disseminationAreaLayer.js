import { GeoJsonLayer } from '@deck.gl/layers';

function scoreToColor(feature, alpha) {
  switch (feature.properties.normalized_da_score) {
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

export function getDisseminationAreaLayer({ data, visible = true, onClick } = {}) {
   return new GeoJsonLayer({
    id: 'dissemination-areas',
    data,
    filled: true,
    getFillColor: (feature) => scoreToColor(feature, 80),
    stroked: true,
    getLineColor: [128, 128, 128],
    // getLineColor: (feature) => 
    //   feature.properties.dauid === selectedId ? [0, 0, 0, 255] : [128, 128, 128, 180],
    getLineWidth: 3,
    pickable: true,
    visible,
    onClick,
    updateTriggers: {
      getFillColor: [data],
     // getLineColor: [data],
    },
  });
}

export function getDAHighlightLayer({ data, visible = true, onClick, selectedDA } = {}) {
  console.log("selected DA: " + selectedDA);
  
  if (!selectedDA) return null;
  
  return new GeoJsonLayer({
    id: 'dissemination-highlight',
    data: {type: 'FeatureCollection', features:[selectedDA]},
    filled: false,
    stroked: true,
    getLineColor: [0, 0, 0, 255],
    getLineWidth: 3,
    pickable: false,
    visible,
  });
}