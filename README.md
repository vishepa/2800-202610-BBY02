# Vancouver Food Accessibility Map - Onion Map

---

## Project Description

A web-based interactive map that visualizes food accessibility across Vancouver's dissemination areas, helping residents and urban planners identify food deserts and simulate the impact of new food assets.

---

## Table of Contents

1. [Project Description](#project-description)
2. [Technologies Used](#technologies-used)
3. [File Contents](#file-contents)
4. [Installation and Setup](#installation-and-setup)
5. [How to Use the Product](#how-to-use-the-product)
6. [Credits, References, and Licenses](#credits-references-and-licenses)
7. [AI and API Usage](#ai-and-api-usage)
8. [Limitations and Future Work](#limitations-and-future-work)
9. [Contact Information](#contact-information)

---

## Technologies Used

### Frontend
- React 19
- Tailwind CSS 4
- Vite 8 (build tool and dev server)
- React Router DOM

### Mapping
- MapLibre GL JS (map rendering)
- deck.gl (data visualization layers)
- Turf.js (geospatial analysis and simulation scoring)
- Supercluster (marker clustering)
- OpenFreeMap (basemap tiles)

### Backend
- Node.js
- Express 5
- pg / node-postgres (database driver)
- Joi (request validation)
- jsonwebtoken (JWT verification)
- nodemon (dev auto-restart)

### Database
- PostgreSQL with PostGIS extension (hosted on Supabase)

### Authentication
- Supabase Auth (JWT-based)

### AI
- Groq API running Llama 3.3 70B (AI-generated area summaries)

### Data Preparation
- Python 3 with pandas (one-time script for parsing dissemination area data)

### Dev Tools
- ESLint
- concurrently (runs frontend and backend in one command)

---

## File Contents

```
2800-202610-BBY02/
├── index.html                                      # HTML entry point
├── package.json                                    # Frontend dependencies and scripts
├── vite.config.js                                  # Vite config with API proxy
├── eslint.config.js                                # ESLint configuration
├── .env                                            # Frontend environment variables (not committed)
├── .gitignore
│
├── server/
│   ├── app.js                                      # Express entry point, route mounting
│   ├── databaseConnection.js                       # PostgreSQL connection pool
│   ├── package.json                                # Backend dependencies and scripts
│   ├── .env                                        # Backend environment variables (not committed)
│   ├── lib/
│   │   └── groq.js                                 # Groq/Llama AI summary generation and caching
│   └── routes/
│       ├── foodAssets.js                            # CRUD for food asset locations
│       ├── transitStops.js                         # Transit stop data
│       ├── disseminationArea.js                    # Single DA lookup
│       ├── disseminationAreaBoundaries.js           # DA polygon boundaries (GeoJSON)
│       ├── disseminationAreaStatistics.js           # DA demographic/income stats
│       ├── isochrones.js                           # Walking-distance isochrone polygons
│       ├── vulnerabilityScores.js                  # Food vulnerability scoring
│       ├── simulation.js                           # Simulation save/load
│       └── aiSummary.js                            # AI summary endpoint
│
└── src/
    ├── Main.jsx                                    # React app entry, router setup
    ├── App.jsx                                     # Top-level layout, page switching
    ├── App.css                                     # Global styles
    ├── index.css                                   # Tailwind base imports
    ├── assets/
    │   ├── hero.png
    │   ├── react.svg
    │   └── vite.svg
    ├── constants/
    │   ├── mapDefaults.js                          # Default map center, zoom, bounds
    │   └── foodCategories.js                       # Food asset category definitions
    ├── lib/
    │   ├── api.js                                  # Frontend API call helpers
    │   ├── scoring.js                              # Turf.js simulation scoring logic
    │   ├── disseminationFacts.js                   # DA data formatting utilities
    │   ├── heritage.js                             # Heritage mode easter egg logic
    │   ├── simulations.js                          # Simulation state management
    │   └── hooks/
    │       ├── useFoodAssets.js                     # Hook for fetching food assets
    │       ├── useDisseminationAreas.js             # Hook for fetching DA data
    │       ├── useTransitStops.js                   # Hook for fetching transit stops
    │       └── useAISummary.js                      # Hook for AI summary requests
    ├── layers/
    │   ├── foodAssetLayer.js                       # deck.gl food asset markers
    │   ├── vulnerabilityLayer.js                   # Vulnerability heatmap layer
    │   ├── affordabilityLayer.js                   # Affordability choropleth
    │   ├── disseminationAreaLayer.js               # DA boundary polygons
    │   ├── transitLayer.js                         # Transit stop markers
    │   ├── simAssetLayer.js                        # Simulated asset markers
    │   └── testLayer.js                            # Dev testing layer
    └── components/
        ├── LayerToggleDropdown.jsx                 # Map layer visibility controls
        ├── account/
        │   ├── Account.jsx                         # Account/profile page
        │   └── LoginSignupPopup.jsx                # Login and signup modal
        ├── shared/
        │   ├── Header.jsx                          # App header and navigation
        │   ├── TogglePage.jsx                      # Map/Sim mode toggle
        │   ├── useScreenWidth.jsx                  # Responsive screen width hook
        │   └── authentication/
        │       ├── AuthContext.jsx                  # React auth context provider
        │       ├── Authentication.jsx               # Auth state management
        │       └── supabaseClient.js               # Supabase client initialization
        └── map/
            ├── Map.jsx                             # Main MapLibre GL map component
            ├── MapPage.jsx                         # Map page layout and state
            ├── SearchBar.jsx                       # Food asset search
            ├── FilterDropdown.jsx                  # Layer filter controls
            ├── FoodTypeFilter.jsx                  # Filter by food category
            ├── FeaturePopup.jsx                    # Popup routing for clicked features
            ├── FoodInfoPanel.jsx                   # Food asset detail panel
            ├── DAInfoPanel.jsx                     # Dissemination area info panel
            ├── TransitInfoPanel.jsx                # Transit stop detail panel
            ├── DeckGLOverlay.jsx                   # deck.gl overlay on MapLibre
            ├── Tooltip.jsx                         # Hover tooltip component
            ├── TestMarker.jsx                      # Dev testing marker
            ├── MapSimButton.jsx                    # Simulation mode toggle (desktop)
            ├── MapSimButtonMobile.jsx              # Simulation mode toggle (mobile)
            ├── SimulationToolbar.jsx                # Simulation controls and sliders
            ├── simulation/
            │   ├── IconPicker.jsx                  # Pick icon for simulated assets
            │   ├── PlacedAssetList.jsx              # List of placed simulation assets
            │   └── SaveSimulationModal.jsx          # Save simulation dialog
            └── popups/
                ├── DisseminationPopup.jsx           # DA click popup content
                └── LayerPopup.jsx                   # Generic layer popup
```

---

## Installation and Setup

### Prerequisites

Install the following before starting:

1. **Node.js** (v18 or higher) and npm
   - Download from https://nodejs.org/
2. **Git**
   - Download from https://git-scm.com/
3. **A code editor** (VS Code recommended)
   - Download from https://code.visualstudio.com/

No local database installation is required. The project uses a hosted PostgreSQL instance on Supabase.

### Required API Keys

You will need the following API keys. Ask a team member for the values or create your own:

| Key | Where to Get It | Used For |
|-----|-----------------|----------|
| `VITE_SUPABASE_URL` | [Supabase Dashboard](https://supabase.com/) | Frontend auth and database access |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API | Frontend auth |
| `DATABASE_URL` | Supabase Dashboard > Settings > Database | Backend PostgreSQL connection |
| `SUPABASE_JWT_SECRET` | Supabase Dashboard > Settings > API | JWT token verification |
| `GROQ_API_KEY` | [Groq Console](https://console.groq.com/) | AI-generated area summaries |

### Step-by-Step Setup

#### 1. Clone the repository

```bash
git clone https://github.com/vishepa/2800-202610-BBY02.git
cd 2800-202610-BBY02
```

#### 2. Install dependencies

**macOS / Linux (Terminal):**
```bash
npm install
cd server && npm install && cd ..
```

**Windows (PowerShell):**
```powershell
npm install
Set-Location server; npm install; Set-Location ..
```

#### 3. Set up frontend environment variables

Create a `.env` file in the project root:

**macOS / Linux:**
```bash
cat <<EOF > .env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EOF
```

**Windows (PowerShell):**
```powershell
@"
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
"@ | Out-File -Encoding utf8 .env
```

Or create the `.env` file manually in your editor with the contents above.

#### 4. Set up backend environment variables

Create a `.env` file inside the `server/` directory:

**macOS / Linux:**
```bash
cat <<EOF > server/.env
PORT=3000
DATABASE_URL=your_postgresql_connection_string_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
GROQ_API_KEY=your_groq_api_key_here
EOF
```

**Windows (PowerShell):**
```powershell
@"
PORT=3000
DATABASE_URL=your_postgresql_connection_string_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
GROQ_API_KEY=your_groq_api_key_here
"@ | Out-File -Encoding utf8 server/.env
```

Or create the `server/.env` file manually in your editor with the contents above.

#### 5. Start both servers

```bash
npm run dev
```

This launches:
- Vite frontend at `http://localhost:5173`
- Express backend at `http://localhost:3000`

The Vite dev server proxies `/api` requests to the Express backend automatically.

#### 6. Open your browser

Go to `http://localhost:5173`

### Testing

Link to testing plan: [docs/testing-plan.md](docs/testing-plan.md)

### Note on Credentials

Admin, user, and server login credentials are stored in a separate `passwords.txt` file submitted via the D2L Dropbox. This file is not included in the repository.

---

## How to Use the Product

### Interactive Map
- View Vancouver with food assets (grocery stores, community gardens, farmers markets, food banks) displayed as markers on the map.
- Click any marker to see details including name, category, and address.
- Use the search bar to find specific food assets by name.
- Filter markers by food category using the filter dropdown.

### Layer Controls
- Toggle data layers on and off: food assets, vulnerability heatmap, affordability choropleth, dissemination area boundaries, and transit stops.
- Click a dissemination area polygon to view demographic stats (population density, median income, commute patterns) and an AI-generated food accessibility summary.

### Simulation Mode
- Switch from Map view to Simulation view to test the impact of adding new food assets.
- Click on the map to place simulated food assets at any location.
- Choose the type and icon for each placed asset.
- Adjust scoring weights with the slider controls.
- See dissemination area colors update in real time based on the simulated changes.
- Save simulations to your account and reload them later.

### AI Summaries
- Click on a dissemination area and request an AI-generated summary.
- Choose between "resident" (plain language) and "planner" (policy-focused) summary styles.
- Summaries include local data on nearby food options, income levels, and transit access.

### User Accounts
- Sign up and log in through Supabase Auth.
- Save and load simulation configurations from your account page.

---

## Credits, References, and Licenses

### Data Sources
- Food asset locations: City of Vancouver Open Data
- Dissemination area boundaries and demographics: Statistics Canada Census
- Transit stop locations: TransLink GTFS data

### Credits
- Built by Team BBY-02 for COMP 2800 at BCIT

### License
This project is licensed under the MIT License. See the LICENSE file for details.

---

## AI and API Usage

### Groq API (Llama 3.3 70B)
- **What**: The Groq API is used to generate natural language summaries of dissemination areas.
- **How**: When a user clicks a dissemination area and requests a summary, the backend sends the area's demographic statistics and nearby food asset data to Groq's chat completion endpoint. The AI returns a 3-4 sentence summary tailored to either a "resident" or "planner" persona.
- **Where in the code**: `server/lib/groq.js` handles prompt construction and API calls. `server/routes/aiSummary.js` is the Express route. `src/lib/hooks/useAISummary.js` is the frontend hook.
- **Caching**: Summaries are cached in memory on the server to avoid redundant API calls for the same area and persona.

### Supabase
- **What**: Supabase provides the hosted PostgreSQL database (with PostGIS for geospatial queries) and authentication.
- **How**: The frontend uses the Supabase JS client for user sign-up, login, and session management. The backend connects directly to the Supabase PostgreSQL instance using the `pg` driver for all data queries (food assets, dissemination area stats, isochrones, transit stops).
- **Where in the code**: `src/components/shared/authentication/supabaseClient.js` initializes the frontend client. `server/databaseConnection.js` sets up the backend connection pool.

### OpenFreeMap
- **What**: OpenFreeMap provides the basemap tile layer that renders the street map underneath the data layers.
- **How**: The MapLibre GL map component loads vector tiles from OpenFreeMap's tile server using the Positron style.

### Python / pandas (Data Preparation)
- **What**: Python with the pandas library was used as a one-time data preparation step to parse and clean raw dissemination area data before importing it into the database.
- **How**: Raw CSV datasets from Statistics Canada were loaded into pandas DataFrames, filtered, transformed, and exported into a format suitable for PostgreSQL/PostGIS ingestion. This script does not run as part of the application and developers do not need to re-run it.

### Turf.js
- **What**: Turf.js is a geospatial analysis library used for client-side simulation scoring.
- **How**: When a user places simulated food assets, Turf.js calculates buffer zones around each asset, intersects them with dissemination area polygons, and computes updated vulnerability scores in real time without needing a server round-trip.
- **Where in the code**: `src/lib/scoring.js`

### AI Tools Used During Development
- **Claude** (Anthropic): Used for debugging, and planning throughout the development process.

---

## Limitations and Future Work

### Limitations
- Food asset data is a static snapshot from the City of Vancouver Open Data portal and does not update in real time as businesses open or close.
- The vulnerability scoring model uses a simplified weighting system and may not capture all factors that affect food accessibility.
- AI-generated summaries are limited by the data provided to the model and may occasionally produce inaccurate or generalized descriptions.
- The simulation tool models food access based on geographic proximity only and does not account for factors like pricing, hours of operation, or cultural food preferences.

### Future Work
- Integrate live data feeds to keep food asset locations up to date.
- Expand coverage beyond Vancouver to other Metro Vancouver municipalities.
- Add more granular simulation parameters such as store type, capacity, and operating hours.
- Refine food asset scoring using the National Nutritious Food Basket (NNFB) spreadsheet from the Government of Canada. We have designed an algorithm that builds virtual shopping carts from the NNFB data and compares them against food assets in each dissemination area. Scores would reflect the actual accessibility and nutritional value of nearby food options, weighted by census demographics such as household income, household size, household composition, and cultural background. We are currently awaiting the NNFB dataset and plan to implement this as a priority feature in phase 2.
- Add export functionality for simulation results and area reports.

---

## Contact Information

### Team BBY-02

| Name | Email | Role |
|------|-------|------|
| Vish Epa | *vishyuh@gmail.com* | Team Member |
| Carlos Fonseca | *cadurcpf@gmail.com* | Team Member |
| Megan Chow | *chow.megan@gmail.com* | Team Member |
| Halie Anastasia | *halieanastasia@gmail.com* | Team Member |
| Adam Olszewski | *adamolszewski06@gmail.com* | Team Member |
