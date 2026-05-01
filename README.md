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

- **Frontend**: HTML, CSS, JavaScript
- **Build Tool**:
- **Backend**:
- **Database**: 

---


## Usage

To run the application locally:

1.  **Clone** the repository.
2.  **Install dependencies** by running `npm install` in the project root directory.
3.  **Start the development server** by running the command: `npm run dev`.
4.  Open your browser and visit the local address shown in your terminal (usually `http://localhost:5173` or similar).

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
