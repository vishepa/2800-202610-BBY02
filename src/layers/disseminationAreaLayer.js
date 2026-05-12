import { GeoJsonLayer } from '@deck.gl/layers';

// Temporary data to be removed once we have the dissemination area GeoJSON data from database
const tempData = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "score": 10, "DAUID": "59150401", "neighbourhood": "Stanley Park West" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1650, 49.3020], [-123.1580, 49.3035], [-123.1510, 49.3010],
        [-123.1530, 49.2975], [-123.1620, 49.2960], [-123.1650, 49.3020]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 9, "DAUID": "59150402", "neighbourhood": "Coal Harbour West" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1370, 49.2935], [-123.1295, 49.2940], [-123.1280, 49.2910],
        [-123.1350, 49.2900], [-123.1390, 49.2915], [-123.1370, 49.2935]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 9, "DAUID": "59150403", "neighbourhood": "Coal Harbour East" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1280, 49.2940], [-123.1210, 49.2945], [-123.1190, 49.2915],
        [-123.1250, 49.2905], [-123.1290, 49.2918], [-123.1280, 49.2940]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 8, "DAUID": "59150404", "neighbourhood": "West End North" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1430, 49.2900], [-123.1360, 49.2905], [-123.1340, 49.2870],
        [-123.1400, 49.2855], [-123.1445, 49.2870], [-123.1430, 49.2900]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 8, "DAUID": "59150405", "neighbourhood": "West End Central" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1360, 49.2900], [-123.1290, 49.2905], [-123.1270, 49.2870],
        [-123.1330, 49.2855], [-123.1370, 49.2868], [-123.1360, 49.2900]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 7, "DAUID": "59150406", "neighbourhood": "West End South" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1430, 49.2855], [-123.1355, 49.2860], [-123.1340, 49.2820],
        [-123.1410, 49.2810], [-123.1445, 49.2825], [-123.1430, 49.2855]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 8, "DAUID": "59150407", "neighbourhood": "Robson Street" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1290, 49.2900], [-123.1210, 49.2905], [-123.1195, 49.2872],
        [-123.1260, 49.2860], [-123.1295, 49.2875], [-123.1290, 49.2900]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 7, "DAUID": "59150408", "neighbourhood": "Downtown North" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1210, 49.2905], [-123.1130, 49.2908], [-123.1115, 49.2875],
        [-123.1180, 49.2862], [-123.1215, 49.2878], [-123.1210, 49.2905]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 6, "DAUID": "59150409", "neighbourhood": "Burrard Station" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1130, 49.2908], [-123.1055, 49.2912], [-123.1040, 49.2878],
        [-123.1105, 49.2865], [-123.1140, 49.2880], [-123.1130, 49.2908]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 5, "DAUID": "59150410", "neighbourhood": "Gastown West" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1055, 49.2840], [-123.0980, 49.2845], [-123.0965, 49.2812],
        [-123.1030, 49.2800], [-123.1065, 49.2815], [-123.1055, 49.2840]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 4, "DAUID": "59150411", "neighbourhood": "Gastown East" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.0980, 49.2845], [-123.0905, 49.2848], [-123.0890, 49.2815],
        [-123.0955, 49.2803], [-123.0988, 49.2818], [-123.0980, 49.2845]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 3, "DAUID": "59150412", "neighbourhood": "Waterfront East" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.0905, 49.2848], [-123.0830, 49.2850], [-123.0815, 49.2818],
        [-123.0878, 49.2805], [-123.0912, 49.2820], [-123.0905, 49.2848]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 7, "DAUID": "59150413", "neighbourhood": "Downtown Core West" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1210, 49.2872], [-123.1130, 49.2875], [-123.1115, 49.2840],
        [-123.1180, 49.2828], [-123.1215, 49.2842], [-123.1210, 49.2872]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 6, "DAUID": "59150414", "neighbourhood": "Downtown Core Central" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1130, 49.2875], [-123.1055, 49.2878], [-123.1040, 49.2843],
        [-123.1105, 49.2832], [-123.1138, 49.2845], [-123.1130, 49.2875]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 5, "DAUID": "59150415", "neighbourhood": "Granville Strip" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1055, 49.2878], [-123.0980, 49.2880], [-123.0965, 49.2845],
        [-123.1030, 49.2833], [-123.1062, 49.2848], [-123.1055, 49.2878]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 4, "DAUID": "59150416", "neighbourhood": "Chinatown North" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.0980, 49.2800], [-123.0905, 49.2803], [-123.0890, 49.2768],
        [-123.0955, 49.2757], [-123.0988, 49.2772], [-123.0980, 49.2800]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 3, "DAUID": "59150417", "neighbourhood": "Chinatown South" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.0905, 49.2803], [-123.0830, 49.2805], [-123.0815, 49.2770],
        [-123.0880, 49.2760], [-123.0912, 49.2773], [-123.0905, 49.2803]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 2, "DAUID": "59150418", "neighbourhood": "DTES West" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.0830, 49.2810], [-123.0755, 49.2813], [-123.0740, 49.2778],
        [-123.0805, 49.2767], [-123.0838, 49.2782], [-123.0830, 49.2810]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 1, "DAUID": "59150419", "neighbourhood": "DTES East" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.0755, 49.2813], [-123.0680, 49.2815], [-123.0665, 49.2780],
        [-123.0730, 49.2770], [-123.0762, 49.2783], [-123.0755, 49.2813]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 7, "DAUID": "59150420", "neighbourhood": "Yaletown North" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1210, 49.2840], [-123.1130, 49.2843], [-123.1115, 49.2808],
        [-123.1180, 49.2796], [-123.1215, 49.2810], [-123.1210, 49.2840]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 7, "DAUID": "59150421", "neighbourhood": "Yaletown South" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1210, 49.2808], [-123.1130, 49.2810], [-123.1115, 49.2775],
        [-123.1180, 49.2764], [-123.1215, 49.2777], [-123.1210, 49.2808]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 6, "DAUID": "59150422", "neighbourhood": "BC Place" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1130, 49.2778], [-123.1055, 49.2780], [-123.1040, 49.2745],
        [-123.1105, 49.2735], [-123.1138, 49.2748], [-123.1130, 49.2778]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 5, "DAUID": "59150423", "neighbourhood": "False Creek North" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1290, 49.2768], [-123.1210, 49.2772], [-123.1195, 49.2738],
        [-123.1260, 49.2727], [-123.1298, 49.2740], [-123.1290, 49.2768]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 8, "DAUID": "59150424", "neighbourhood": "Davie Village" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1355, 49.2820], [-123.1280, 49.2825], [-123.1265, 49.2790],
        [-123.1330, 49.2778], [-123.1362, 49.2793], [-123.1355, 49.2820]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 9, "DAUID": "59150425", "neighbourhood": "English Bay" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1445, 49.2820], [-123.1365, 49.2825], [-123.1348, 49.2790],
        [-123.1415, 49.2778], [-123.1452, 49.2793], [-123.1445, 49.2820]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 4, "DAUID": "59150426", "neighbourhood": "Strathcona North" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.0830, 49.2778], [-123.0755, 49.2780], [-123.0740, 49.2745],
        [-123.0805, 49.2735], [-123.0838, 49.2748], [-123.0830, 49.2778]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 2, "DAUID": "59150427", "neighbourhood": "Strathcona South" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.0755, 49.2778], [-123.0680, 49.2780], [-123.0665, 49.2745],
        [-123.0730, 49.2735], [-123.0762, 49.2748], [-123.0755, 49.2778]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 6, "DAUID": "59150428", "neighbourhood": "Victory Square" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1055, 49.2843], [-123.0980, 49.2845], [-123.0965, 49.2810],
        [-123.1030, 49.2798], [-123.1062, 49.2813], [-123.1055, 49.2843]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 5, "DAUID": "59150429", "neighbourhood": "Crosstown" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.0980, 49.2768], [-123.0905, 49.2770], [-123.0890, 49.2735],
        [-123.0955, 49.2724], [-123.0988, 49.2738], [-123.0980, 49.2768]
      ]]}
    },
    {
      "type": "Feature",
      "properties": { "score": 11, "DAUID": "59150430", "neighbourhood": "Stanley Park South" },
      "geometry": { "type": "Polygon", "coordinates": [[
        [-123.1530, 49.2960], [-123.1450, 49.2970], [-123.1430, 49.2930],
        [-123.1500, 49.2915], [-123.1545, 49.2932], [-123.1530, 49.2960]
      ]]}
    }
  ]
}

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

async function loadDisseminationData(){
    let response = await fetch('/api/dissemination-areas');
    const AREA_DATA = await response.json();
    return AREA_DATA;
}


function scoreToColor(feature, alpha){
  const randomNumber = Math.floor(Math.random() * 10) + 1;
  
  // switch (feature.properties.score) {
  switch(randomNumber){
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

export function getDisseminationAreaLayer({data, visible = true,onClick} = {}) {
  return new GeoJsonLayer({
    id: 'dissemination-areas',
    data: loadDisseminationData(),
    // data: tempData,
    filled: true,
    getFillColor: (feature) => scoreToColor(feature, 60),
    stroked: true,
    getLineColor: (feature) => scoreToColor(feature, 255),
    getLineWidth: 10,
    pickable: true,
    visible, 
    onClick,
  });
}
