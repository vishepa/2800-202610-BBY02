import { GeoJsonLayer } from '@deck.gl/layers';
/*
// Temporary data to be removed once we have the dissemination area GeoJSON data from database
// const tempData = {
//   "type": "FeatureCollection",
//   "features": [
//     {
//       "type": "Feature",
//       "properties": {
//         "DAUID": "59150369",
//         "PRUID": "59",
//         "neighbourhood": "Coal Harbour",
//         "population": 54056,
//         "medianIncome": 100500,
//         "source": "Statistics Canada 2021 Census — coordinates approximated from street grid, replace with lda_000b21a_e.zip for production"
//       },
//       "geometry": {
//         "type": "Polygon",
//         "coordinates": [
//           [
//             [-123.1284, 49.2899],
//             [-123.1207, 49.2899],
//             [-123.1207, 49.2858],
//             [-123.1284, 49.2858],
//             [-123.1284, 49.2899]
//           ]
//         ]
//       }
//     },
//     {
//       "type": "Feature",
//       "properties": {
//         "DAUID": "59150371",
//         "PRUID": "59",
//         "neighbourhood": "Downtown Core",
//         "population": 62190,
//         "medianIncome": 120000,
//         "source": "Statistics Canada 2021 Census — coordinates approximated from street grid, replace with lda_000b21a_e.zip for production"
//       },
//       "geometry": {
//         "type": "Polygon",
//         "coordinates": [
//           [
//             [-123.1207, 49.2858],
//             [-123.1139, 49.2858],
//             [-123.1139, 49.2810],
//             [-123.1207, 49.2810],
//             [-123.1207, 49.2858]
//           ]
//         ]
//       }
//     },
//     {
//       "type": "Feature",
//       "properties": {
//         "DAUID": "59150374",
//         "PRUID": "59",
//         "neighbourhood": "Yaletown North",
//         "population": 578890,
//         "medianIncome": 200000,
//         "source": "Statistics Canada 2021 Census — coordinates approximated from street grid, replace with lda_000b21a_e.zip for production"
//       },
//       "geometry": {
//         "type": "Polygon",
//         "coordinates": [
//           [
//             [-123.1207, 49.2810],
//             [-123.1139, 49.2810],
//             [-123.1139, 49.2762],
//             [-123.1207, 49.2762],
//             [-123.1207, 49.2810]
//           ]
//         ]
//       }
//     }
//   ]
// }
*/



// const AREAS_BY_DAUID = {};
// GEO_JSON.features.forEach(feature =>{
//   AREAS_BY_DAUID[feature.properties.dauid] = feature});


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

async function loadDisseminationData (){
    let response = await fetch('/api/dissemination-areas');
    const AREA_DATA = await response.json();
    return AREA_DATA;
}

export function getDisseminationAreaLayer(onClick) {
  return new GeoJsonLayer({
    id: 'dissemination-areas',
    data: loadDisseminationData(),
    filled: true,
    getFillColor: [171, 212, 185, 60],
    stroked: true,
    getLineColor: [0, 50, 31, 255],
    getLineWidth: 20,
    pickable: true, 
    onClick,
  });
}
