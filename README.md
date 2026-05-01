# Food Accessibility Heatmap


## Overview


---


## Features

- 
- 
- 
- 

---


## Technologies Used

- **Frontend**: React, Tailwind CSS, React Router
- **Build Tool**: Vite
- **Mapping**: MapLibre GL JS, deck.gl, Turf.js, MapTiler (basemap tiles)
- **Backend**: Node.js, Express, pg (node-postgres), Joi, jsonwebtoken
- **Database**: PostgreSQL with PostGIS (hosted on Supabase)
- **Auth**: Supabase Auth (JWT verified in Express middleware)

---


## Usage

To run the application locally:

1.  **Clone** the repository.
2.  **Install frontend dependencies** by running `npm install` in the project root.
3.  **Install backend dependencies** by running `npm install` inside the `server/` directory.
4.  **Set up environment variables**:
    - Copy `.env.example` to `.env` in the project root and fill in the values.
    - Copy `server/.env.example` to `server/.env` and fill in the values.
5.  **Start the development servers** by running `npm run dev` from the project root. This starts the Vite frontend (`http://localhost:5173`) and the Express backend (`http://localhost:3000`) together.
6.  Open your browser and visit `http://localhost:5173`.

Once the application is running:


---


## Project Structure

```

├── server/
│   ├── app.js                          # Express entry point
│   ├── databaseConnection.js
│   └── routes/                         # Database queries
│       ├── foodAssets.js
│       ├── vulnerabilityScores.js
│       ├── transitStops.js
│       └── simulation.js
|
└── src/
    ├── main.jsx                        # Mounts React app onto HTML page
    ├── App.jsx                         # Top-level component for overall layout
    ├── lib/
    │   ├── api.js                      # Interface for api calls
    │   └── scoring.js                  # Turf.js simulation previews
    ├── components/
    │   ├── Map.jsx                     
    │   ├── Sidebar.jsx
    │   └── SimulationToolbar.jsx
    └── layers/
        ├── FoodAssetLayer.js
        ├── VulnerabilityLayer.js
        ├── AffordabilityLayer.js
        └── TransitLayer.js
 
```

## Team Information
Team Name: BBY-02
Team Members: 
- Vish Epa
- Carlos Fonseca
- Megan Chow
- Halie Anastasia
- Adam Olszewski
## More details to come
TBA


## Acknowledgments

---


## Limitations and Future Work
### Limitations

### Future Work


---


## License

This project is licensed under the MIT License. See the LICENSE file for details.
