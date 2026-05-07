import { GeoJsonLayer } from '@deck.gl/layers';

// Temporary data to be removed once we have the dissemination area GeoJSON data from database
const tempData = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "DAUID": "59150369",
        "PRUID": "59",
        "neighbourhood": "Coal Harbour",
        "population_2021": 540,
        "dwellings": 312,
        "source": "Statistics Canada 2021 Census — coordinates approximated from street grid, replace with lda_000b21a_e.zip for production"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-123.1284, 49.2899],
            [-123.1207, 49.2899],
            [-123.1207, 49.2858],
            [-123.1284, 49.2858],
            [-123.1284, 49.2899]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "DAUID": "59150371",
        "PRUID": "59",
        "neighbourhood": "Downtown Core",
        "population_2021": 621,
        "dwellings": 398,
        "source": "Statistics Canada 2021 Census — coordinates approximated from street grid, replace with lda_000b21a_e.zip for production"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-123.1207, 49.2858],
            [-123.1139, 49.2858],
            [-123.1139, 49.2810],
            [-123.1207, 49.2810],
            [-123.1207, 49.2858]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "DAUID": "59150374",
        "PRUID": "59",
        "neighbourhood": "Yaletown North",
        "population_2021": 578,
        "dwellings": 421,
        "source": "Statistics Canada 2021 Census — coordinates approximated from street grid, replace with lda_000b21a_e.zip for production"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-123.1207, 49.2810],
            [-123.1139, 49.2810],
            [-123.1139, 49.2762],
            [-123.1207, 49.2762],
            [-123.1207, 49.2810]
          ]
        ]
      }
    }
  ]
}

export function getDisseminationAreaLayer() {
  return new GeoJsonLayer({
    id: 'dissemination-areas',
    data: tempData,
    filled: false,
    stroked: true,
    getLineColor: [255, 0, 0, 255],
    getLineWidth: 20,
  });
}
