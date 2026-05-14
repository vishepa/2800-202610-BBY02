import { GeoJsonLayer } from '@deck.gl/layers';

async function getAreaGeoJSON(){
    const RESPONSE = await fetch('/api/da-boundaries');
    const BOUNDARY_DATA = await RESPONSE.json();
    return BOUNDARY_DATA;
}

async function getAreaProperties(){
    let RESPONSE = await fetch('/api/da-statistics');
    const PROPERTY_DATA = await RESPONSE.json();
    return  PROPERTY_DATA;
}

async function loadDisseminationData(){
    let response = await fetch('/api/dissemination-areas');
    const AREA_DATA = await response.json();
    return AREA_DATA;
}


function scoreToColor(feature, alpha) {
  switch (feature.properties.normalized_da_score) {
    case 1:  return [235, 40,  50,  alpha];
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

export function getDisseminationAreaLayer({data, visible = true,onClick} = {}) {
  return new GeoJsonLayer({
    id: 'dissemination-areas',
    data: loadDisseminationData(),
    filled: true,
    getFillColor: (feature) => scoreToColor(feature, 60),
    stroked: true,
    getLineColor: [128, 128, 128], //(feature) => scoreToColor(feature, 255),
    getLineWidth: 3,
    pickable: true,
    visible, 
    onClick,
  });
}
