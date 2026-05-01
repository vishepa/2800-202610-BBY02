# API Routes

All routes are prefixed with `/api`. The Express server runs on port 3000 in development.

All successful responses return JSON. Geometry is returned as GeoJSON, ready for MapLibre/deck.gl.

## Routes summary

| Method | URL | Action |
|--------|-----|--------|
| `GET` | `/api/food` | Return all food retail locations as GeoJSON |
| `GET` | `/api/food?type=grocery` | Return only grocery stores |
| `GET` | `/api/areas` | Return all dissemination areas `with vulnerability scores?` |
| `GET` | `/api/areas/:id` | Return a single dissemination area by ID |
| `GET` | `/api/transit-stops` | Return all TransLink transit stops as GeoJSON |
| `GET` | `/api/scores` | Return vulnerability scores without geometry |

---

## Food Retail

### `GET /api/food`

Returns all food locations as a GeoJSON FeatureCollection.

**Query parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by store type: `supermarket`, `food store`, `community garden`, `free meal`, `low cost meal` |

**Example request**

```
GET /api/food?type=grocery
```

**Example response**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-123.1207, 49.2827]
      },
      "properties": {
        "name": "Sunrise Market",
        "type": "grocery",
        "address": "123 Main St"
      }
    }
  ]
}
```

---

## Dissemination Areas

### `GET /api/areas`

Returns all dissemination area polygons with their computed vulnerability scores and census attributes.

**Example response**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[...]]
      },
      "properties": {
        "area_id": "59150001",
        "median_income": 42000,
        "pct_no_vehicle": 0.38,
        "pct_seniors": 0.21,
        "nearby_stores": 2,
        "avg_transit_frequency": 6,
        "vulnerability_score": 14
      }
    }
  ]
}
```

### `GET /api/areas/:id`

Returns a single dissemination area by ID with full detail.

**Example request**

```
GET /api/areas/59150001
```

---

## Transit Stops

### `GET /api/transit-stops`

Returns all TransLink transit stops as a GeoJSON FeatureCollection.

**Example response**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-123.1045, 49.2612]
      },
      "properties": {
        "stop_id": "10001",
        "stop_name": "Granville St at W Broadway",
        "routes": ["9", "99"],
        "frequency": 8
      }
    }
  ]
}
```

---

## Vulnerability Scores

### `GET /api/scores`

Returns pre-computed vulnerability scores per dissemination area without full geometry — useful for building legends, histograms, or summary statistics in the sidebar without re-fetching all polygon data.

**Example response**

```json
[
  {
    "area_id": "59150001",
    "vulnerability_score": 14,
    "nearby_stores": 2,
    "avg_transit_frequency": 6,
    "median_income": 42000
  }
]
```

---

## Error responses

All routes return standard HTTP status codes.

| Status | Meaning |
|--------|---------|
| `200` | Success |
| `400` | Bad request — invalid query parameter |
| `404` | Resource not found |
| `500` | Server error — check Express logs |

**Example error response**

```json
{
  "error": "Invalid store type. Must be one of: supermarket, food store, community garden, free meal, low cost meal "
}
```