# Architecture

## Overview

The app is a three-tier web application: open data sources feed into a PostgreSQL/PostGIS database, an Express API serves that data as GeoJSON, and a React frontend renders it on an interactive map.

```
Data sources → PostgreSQL + PostGIS → Express API → React frontend
```

---

## Data sources

| Source | What it provides | Format |
|--------|-----------------|--------|
| City of Vancouver Food Asset Map | 944 food resources across 8 categories | CSV |
| Statistics Canada | Dissemination area boundaries + census attributes | Shapefile / GeoJSON |
| TransLink GTFS | Transit stops, routes, and schedules | GTFS (CSV bundle) |

### Geocoding step

The Food Asset Map CSV contains street addresses but no coordinates. Before loading into PostGIS, every record must be geocoded to a lat/lng using Nominatim (OpenStreetMap's geocoder). This is a one-time preprocessing step — see [schema.md](./schema.md) for the geocoding script.

---

## Database — PostgreSQL + PostGIS

Hosted on Supabase (free tier). PostGIS is pre-installed and enabled with one `CREATE EXTENSION`.

Three tables store the open data:

- `food_assets` — all 944 food resource locations, categorised by type
- `dissemination_areas` — census polygon boundaries with income, vehicle ownership, and age attributes
- `transit_stops` — TransLink stop locations with route and frequency data

One materialized view pre-computes vulnerability scores per dissemination area by spatially joining all three tables. This avoids running the expensive spatial join on every API request. Heavy spatial calculations (`ST_Distance`, `ST_DWithin`, hexagon grids) all run server-side in PostGIS — not client-side in Turf.js.

See [schema.md](./schema.md) for full table definitions, column documentation, and spatial query examples.

---

## API — Express

A Node.js Express server queries PostGIS and serves the results as GeoJSON. It runs on port 3000 in development.

PostGIS assembles GeoJSON directly in SQL using `ST_AsGeoJSON` and `json_build_object` — the API returns data that MapLibre and deck.gl can render immediately with no frontend transformation.

Key responsibilities:

- Verifying Supabase JWTs on protected endpoints using `jsonwebtoken`
- Validating request parameters using `joi`
- Running spatial queries against PostGIS via `pg`
- Returning GeoJSON FeatureCollections ready for the map

### Backend packages

| Package | Purpose |
|---------|---------|
| `express` | Server framework |
| `pg` | PostgreSQL driver; works cleanly with PostGIS and parameterized queries |
| `jsonwebtoken` | Verifies JWTs issued by Supabase Auth on protected routes |
| `joi` | Request body and query parameter validation |
| `dotenv` | Loads environment variables from `.env` |
| `nodemon` | Auto-restarts Express on file changes (devDependency) |

See [api-routes.md](./api-routes.md) for the full route reference.

---

## Authentication — Supabase Auth + JWT

Authentication is handled by Supabase Auth. Supabase hashes passwords with bcrypt server-side — plaintext passwords never reach our backend.

When a user logs in, Supabase issues a JWT. The frontend stores this automatically via `@supabase/supabase-js` and attaches it to fetch calls as a Bearer token. The Express backend verifies the JWT using `jsonwebtoken` on any protected endpoints.

This approach avoids maintaining a sessions table or building custom auth. Sessions were considered but ruled out as they would require fighting Supabase's JWT-based architecture and adding extra database tables.

---

## Frontend — React (Vite)

Built with React and bundled by Vite. In development, Vite proxies all `/api` requests to Express so the frontend can call `/api/food-assets` without CORS issues.

**Note on environment variables:** Vite only exposes variables prefixed with `VITE_` to the frontend (e.g. `VITE_SUPABASE_URL`). Backend secrets must not use this prefix.

### Frontend packages

| Package | Purpose |
|---------|---------|
| `react`, `react-dom` | UI framework |
| `vite` | Build tool and dev server |
| `tailwindcss` | Utility-first CSS — iterable UI without separate stylesheets |
| `maplibre-gl` | Base map rendering |
| `deck.gl`, `@deck.gl/react`, `@deck.gl/layers` | Data layer rendering |
| `@supabase/supabase-js` | Auth client — handles signup, login, session management, and JWT attachment |
| `@turf/turf` | Client-side geospatial math for simulation previews (light use only — see below) |

### Map wrapper — decision pending

Two options for integrating MapLibre with React:

**Vanilla MapLibre (`useRef` + `useEffect`)** — initialise the map imperatively inside an effect and call MapLibre methods directly. More boilerplate, especially as layer and filter state grows. Only requires knowing MapLibre's API.

**react-map-gl** — React wrapper that exposes the map, markers, popups, and view state as declarative JSX components. Less boilerplate, cleaner state management, but requires learning the wrapper's API on top of MapLibre's. Recommended given deck.gl's React-first design.

### Layer structure

The map renders several distinct layers toggled independently:

- **Food asset points** — all 944 locations, filterable by category and type (deck.gl )
- **Vulnerability layer** — one hexagon per neighbourhood visualising the vulnerability score (deck.gl `HexagonLayer`)
- **Density layer** — food asset density across the city (layer type TBD)
- **Transit stops** — TransLink stop locations (deck.gl )

### Turf.js — simulation previews only

`@turf/turf` is used exclusively for lightweight client-side estimates during the simulation feature — for example, rough hexagon impact previews while the backend computes actual scores. All heavy spatial calculations remain in PostGIS. If Turf ends up running slow during the simulation, move that logic server-side too.

---

## Data flow

```
1. Open data downloaded from source
2. Food Asset Map addresses geocoded via Nominatim → lat/lng added
3. All data loaded into PostGIS tables via Node.js scripts
4. Vulnerability scores pre-computed as a materialized view in PostGIS
5. React app fetches GeoJSON from Express endpoints on load
6. deck.gl renders layers on top of MapLibre base map
7. Planner hovers/clicks → deck.gl pickable layers update sidebar with area detail
8. Simulation feature → Turf.js preview client-side → full score recomputed server-side
```

---

## Development setup

Two processes run simultaneously in development:

| Process | Command | Port |
|---------|---------|------|
| Express API | `npm run dev` (in `/server`) | 3000 |
| React + Vite | `npm run dev` (in `/client`) | 5173 |

Vite proxies `/api/*` to `http://localhost:3000` — see [setup.md](./setup.md) for full installation instructions.

---

## Tech stack summary

| Layer | Technology | Reason |
|-------|-----------|--------|
| Database | PostgreSQL + PostGIS | Spatial queries — `ST_DWithin`, `ST_AsGeoJSON`, hexagon grids |
| DB hosting | Supabase | Hosted Postgres with PostGIS; free tier; built-in Auth |
| API | Node.js + Express | Required; spatial query complexity and GeoJSON assembly |
| DB client | `pg` (node-postgres) | Lightweight; parameterized queries; PostGIS compatible |
| Auth | Supabase Auth + JWT | No sessions table needed; bcrypt handled server-side by Supabase |
| JWT verification | `jsonwebtoken` | Verifies Supabase-issued tokens on protected Express routes |
| Validation | `joi` | Request validation at the API boundary |
| Frontend | React + Vite | State management suits filters and simulation; deck.gl is React-first |
| Styling | Tailwind CSS | Utility-first; integrates via Vite plugin; no separate stylesheets |
| Map renderer | MapLibre GL JS | Open source; no API key; works natively with deck.gl |
| Map wrapper | react-map-gl |  |
| Data layers | deck.gl (`@deck.gl/react`, `@deck.gl/layers`) | Heatmap with various layer styles |
| Base tiles | OpenFreeMap | Free, no key required |
| Client geospatial | `@turf/turf` | Lightweight simulation previews only — heavy math stays in PostGIS |
| Geocoder | Nominatim | Free, open source; rate-limited to 1 req/s |