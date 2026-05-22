# Testing Plan - Vancouver Food Accessibility Map

## Overview

This document outlines the manual testing plan for the Vancouver Food Accessibility Map. Each test case includes steps to reproduce, expected results, and columns for tracking pass/fail status across test runs.

---

## Test Environment

- **Browsers tested**: Chrome (latest), Firefox (latest), Safari (latest), Edge (latest)
- **Devices**: Desktop (1920x1080), Tablet (768px width), Mobile (375px width)
- **Prerequisites**: Application running locally via `npm run dev` with valid `.env` files configured

---

## 1. Authentication

| # | Test Case | Steps | Expected Result | Status | Tester | Date |
|---|-----------|-------|-----------------|--------|--------|------|
| 1.1 | Sign up with valid email | 1. Click account icon 2. Switch to "Sign up" tab 3. Enter valid email, password (6+ chars), confirm password 4. Click "Create account" | Success message appears: "Account created! Check your email to confirm." | | | |
| 1.2 | Sign up with mismatched passwords | 1. Open sign up form 2. Enter different values in password and confirm fields 3. Click "Create account" | Error message: "Passwords do not match." | | | |
| 1.3 | Sign up with short password | 1. Open sign up form 2. Enter a password shorter than 6 characters 3. Click "Create account" | Error message: "Password must be at least 6 characters." | | | |
| 1.4 | Sign up with empty fields | 1. Open sign up form 2. Leave one or more fields empty 3. Click "Create account" | Error message: "Please fill in all fields." | | | |
| 1.5 | Log in with valid credentials | 1. Open login form 2. Enter valid email and password 3. Click "Log in" | Success message appears, popup closes after brief delay, user is logged in | | | |
| 1.6 | Log in with invalid credentials | 1. Open login form 2. Enter incorrect email or password 3. Click "Log in" | Error message from Supabase Auth is displayed | | | |
| 1.7 | Log in with empty fields | 1. Open login form 2. Leave email or password empty 3. Click "Log in" | Error message: "Please fill in all fields." | | | |
| 1.8 | Sign out | 1. Log in 2. Navigate to account page 3. Click "Sign Out" | User is signed out and redirected to login page | | | |
| 1.9 | Close login popup | 1. Click account icon to open popup 2. Click the X button or click outside the popup | Popup closes without any action taken | | | |
| 1.10 | Switch between login and sign up tabs | 1. Open login popup 2. Click "Sign up" tab 3. Click "Log in" tab | Form switches between login and sign up, fields reset each time | | | |

---

## 2. Map Display and Navigation

| # | Test Case | Steps | Expected Result | Status | Tester | Date |
|---|-----------|-------|-----------------|--------|--------|------|
| 2.1 | Initial map load | 1. Open the app at localhost:5173 | Map renders centered on Vancouver with food asset markers visible | | | |
| 2.2 | Zoom in/out | 1. Use scroll wheel or pinch gesture to zoom | Map zooms smoothly between min zoom (9) and max zoom (17) | | | |
| 2.3 | Pan the map | 1. Click and drag the map | Map pans to follow cursor, stays within expected bounds | | | |
| 2.4 | Marker clustering | 1. Zoom out to a level where many markers overlap | Markers cluster into groups with count indicators | | | |
| 2.5 | Cluster expansion | 1. Click on a cluster marker | Map zooms in or expands to show individual markers | | | |
| 2.6 | Welcome popup on first visit | 1. Open the app as a logged-in user for the first time (or clear localStorage) | Welcome popup appears explaining the map's purpose | | | |
| 2.7 | Welcome popup dismissal | 1. Close the welcome popup | Popup does not reappear on subsequent visits for the same user | | | |

---

## 3. Food Asset Interactions

| # | Test Case | Steps | Expected Result | Status | Tester | Date |
|---|-----------|-------|-----------------|--------|--------|------|
| 3.1 | Click a food asset marker | 1. Click on any food asset marker on the map | Info panel opens showing the asset's name, category, and address | | | |
| 3.2 | Search food assets by name | 1. Type a food asset name in the search bar (e.g., "Save On") | Dropdown shows matching results (up to 8), filtered by name | | | |
| 3.3 | Search food assets by address | 1. Type a partial address in the search bar | Dropdown shows matching results filtered by address | | | |
| 3.4 | Select a search result | 1. Search for a food asset 2. Click on a result in the dropdown | Map flies to the selected asset's location, search bar shows the asset's name | | | |
| 3.5 | Clear search | 1. Type a query in the search bar 2. Click the X (clear) button | Search bar clears, dropdown closes, map returns to default view | | | |
| 3.6 | Search with no results | 1. Type a query that matches no food assets (e.g., "xyznonexistent") | Dropdown shows "No results found." | | | |
| 3.7 | Keyboard navigation in search | 1. Type a query 2. Press Arrow Down/Up to navigate results 3. Press Enter to select | Active result highlights with keyboard, Enter selects the highlighted result | | | |
| 3.8 | Close search dropdown on outside click | 1. Type a query to open dropdown 2. Click outside the search bar | Dropdown closes | | | |

---

## 4. Layer Controls

| # | Test Case | Steps | Expected Result | Status | Tester | Date |
|---|-----------|-------|-----------------|--------|--------|------|
| 4.1 | Toggle food assets layer off | 1. Open layer filter dropdown 2. Toggle "Food Assets" off | Food asset markers disappear from the map | | | |
| 4.2 | Toggle food assets layer on | 1. With food assets toggled off 2. Toggle "Food Assets" on | Food asset markers reappear on the map | | | |
| 4.3 | Toggle transit stops layer on | 1. Open layer filter dropdown 2. Toggle "Transit Stops" on | Transit stop markers appear on the map | | | |
| 4.4 | Toggle dissemination areas layer off | 1. Open layer filter dropdown 2. Toggle "Dissemination Areas" off | DA boundary polygons disappear from the map | | | |
| 4.5 | Multiple layer toggles | 1. Toggle all layers off 2. Toggle them back on one at a time | Each layer appears/disappears independently without affecting others | | | |

---

## 5. Dissemination Area Interactions

| # | Test Case | Steps | Expected Result | Status | Tester | Date |
|---|-----------|-------|-----------------|--------|--------|------|
| 5.1 | Click a dissemination area | 1. Click on a colored DA polygon on the map | Info panel opens showing the DA's demographic statistics (population density, median income, commute patterns) | | | |
| 5.2 | DA color coding | 1. Observe the map with DA layer enabled | DAs are color-coded by their vulnerability/accessibility score | | | |
| 5.3 | Request AI summary (resident) | 1. Click a DA 2. In the info panel, request an AI summary with "resident" persona | AI-generated summary appears in plain language, describing the area's food accessibility in 3-4 sentences | | | |
| 5.4 | Request AI summary (planner) | 1. Click a DA 2. Request an AI summary with "planner" persona | AI-generated summary appears in policy-focused language | | | |
| 5.5 | Regenerate AI summary | 1. With an existing summary displayed 2. Click regenerate | A new summary is generated (cache is cleared for that DA/persona combination) | | | |
| 5.6 | AI summary loading state | 1. Request an AI summary | A loading indicator appears while the summary is being generated | | | |
| 5.7 | AI summary error handling | 1. Request an AI summary while the backend is down or the Groq API is unreachable | An error message is displayed instead of the summary | | | |

---

## 6. Simulation Mode

| # | Test Case | Steps | Expected Result | Status | Tester | Date |
|---|-----------|-------|-----------------|--------|--------|------|
| 6.1 | Enter simulation mode | 1. Click the Sim toggle button | View switches to simulation mode, sidebar panel opens, tutorial popup appears on first use | | | |
| 6.2 | Place a simulated asset | 1. In simulation mode, select a food category from the icon picker 2. Click on the map | A simulated marker appears at the clicked location | | | |
| 6.3 | DA colors update after placing asset | 1. Place a simulated food asset near a DA with a low accessibility score | DA polygon colors update in real time to reflect improved accessibility | | | |
| 6.4 | Remove a placed asset | 1. Place one or more assets 2. Click the remove button next to an asset in the placed asset list | The selected asset is removed, DA colors revert accordingly | | | |
| 6.5 | Clear all placed assets | 1. Place multiple assets 2. Click "Clear all" | All simulated assets are removed, DA colors revert to baseline | | | |
| 6.6 | Adjust weight sliders | 1. Open the sidebar slider controls 2. Move the Income Weight or Food Programs Weight sliders | DA colors update to reflect new scoring weights | | | |
| 6.7 | Adjust isochrone slider | 1. Move the isochrone minutes slider from the default (10 min) | DA scores recalculate based on the new walking-time threshold | | | |
| 6.8 | Toggle simulation visibility | 1. In simulation mode, toggle simulation visibility off 2. Toggle it back on | Simulated assets and recolored DAs hide and show accordingly, map falls back to baseline when hidden | | | |
| 6.9 | Switch back to map mode | 1. In simulation mode, click the Map toggle | View switches to map mode, simulated assets are hidden, DA colors show baseline scores | | | |
| 6.10 | Simulation tutorial popup | 1. Enter simulation mode for the first time | Tutorial popup explains simulation mode; does not reappear on subsequent entries | | | |
| 6.11 | Weight slider tutorial popup | 1. Open the sidebar for the first time | Tutorial popup explains weight sliders; does not reappear on subsequent opens | | | |

---

## 7. Simulation Save/Load

| # | Test Case | Steps | Expected Result | Status | Tester | Date |
|---|-----------|-------|-----------------|--------|--------|------|
| 7.1 | Save a simulation | 1. Place assets and adjust sliders 2. Click "Save Simulation" 3. Enter a name and optional description 4. Confirm save | Simulation is saved to the user's account | | | |
| 7.2 | View saved simulations | 1. Navigate to the account page | Saved simulations are listed with name, description, asset count, and creation date | | | |
| 7.3 | Load a saved simulation | 1. On the account page, click on a saved simulation card | App switches to map view in simulation mode with the saved assets placed on the map, camera fits to the placed assets | | | |
| 7.4 | Delete a saved simulation | 1. On the account page, click the X button on a simulation card | Simulation is removed from the list (optimistic UI), confirmed deleted on server | | | |
| 7.5 | Delete simulation error recovery | 1. Delete a simulation while the server is unreachable | Error message appears, the simulation card is restored to the list | | | |
| 7.6 | Empty saved simulations state | 1. Navigate to account page with no saved simulations | Message reads: "No saved simulations yet." with guidance to create one | | | |

---

## 8. Account Page

| # | Test Case | Steps | Expected Result | Status | Tester | Date |
|---|-----------|-------|-----------------|--------|--------|------|
| 8.1 | View profile info | 1. Navigate to the account page | Profile section shows user email and "Member since" date | | | |
| 8.2 | Navigate to account page | 1. Click the account/profile navigation element | Account page renders with profile and saved simulations sections | | | |
| 8.3 | Navigate back to map | 1. From account page, click the map navigation element | Map page renders with previous state intact | | | |

---

## 9. Responsive Design

| # | Test Case | Steps | Expected Result | Status | Tester | Date |
|---|-----------|-------|-----------------|--------|--------|------|
| 9.1 | Desktop layout (760px+) | 1. View the app at 1920x1080 | Sidebar slides from the left, toggle arrow button on the left edge, layer filter at top-right | | | |
| 9.2 | Mobile layout (below 760px) | 1. Resize browser to 375px width or use mobile emulation | Sidebar slides from the bottom as a half-screen sheet with drag handle, search bar takes full width | | | |
| 9.3 | Tablet layout (768px) | 1. Resize browser to 768px width | Layout transitions cleanly between mobile and desktop breakpoints | | | |
| 9.4 | Layer filter position on mobile | 1. View on mobile width | Layer filter dropdown moves to top-16 (below the search bar) instead of top-4 | | | |
| 9.5 | Sidebar open/close on desktop | 1. Click the sidebar toggle arrow | Sidebar slides in/out from the left with smooth animation | | | |
| 9.6 | Sidebar open/close on mobile | 1. Tap the bottom sheet drag handle | Bottom sheet slides up/down with smooth animation | | | |

---

## 10. API Endpoints

| # | Test Case | Steps | Expected Result | Status | Tester | Date |
|---|-----------|-------|-----------------|--------|--------|------|
| 10.1 | GET /api/food-assets | 1. Send GET request to /api/food-assets | Returns GeoJSON FeatureCollection with all food assets | | | |
| 10.2 | GET /api/food-assets with category filter | 1. Send GET request to /api/food-assets?categories=grocery_store | Returns only food assets matching the specified category | | | |
| 10.3 | GET /api/food-assets with search | 1. Send GET request to /api/food-assets?search=Save | Returns food assets matching the search term by name or address | | | |
| 10.4 | GET /api/da-boundaries | 1. Send GET request to /api/da-boundaries | Returns GeoJSON FeatureCollection with all DA polygons | | | |
| 10.5 | GET /api/da-boundaries with dauid | 1. Send GET request to /api/da-boundaries?dauid=59150001 | Returns GeoJSON for the specified DA only | | | |
| 10.6 | GET /api/da-statistics | 1. Send GET request to /api/da-statistics | Returns demographic statistics for dissemination areas | | | |
| 10.7 | GET /api/transit-stops | 1. Send GET request to /api/transit-stops | Returns GeoJSON FeatureCollection with all transit stops | | | |
| 10.8 | GET /api/transit-stops with route filter | 1. Send GET request to /api/transit-stops?routes=99B | Returns only transit stops on the specified route | | | |
| 10.9 | GET /api/transit-stops with search | 1. Send GET request to /api/transit-stops?search=Broadway | Returns transit stops matching the search term by name | | | |
| 10.10 | POST /api/ai/da-summary | 1. Send POST request with body: { "dauid": "59150001", "persona": "resident" } | Returns AI-generated summary and DA statistics | | | |
| 10.11 | POST /api/ai/da-summary without dauid | 1. Send POST request with body: {} | Returns 400 error: "dauid required" | | | |
| 10.12 | POST /api/ai/da-summary with regenerate | 1. Send POST request with body: { "dauid": "59150001", "persona": "resident", "regenerate": true } | Clears cache and returns a fresh AI summary | | | |
| 10.13 | GET /api/test | 1. Send GET request to /api/test | Returns { "status": "ok" } | | | |

---

## 11. Edge Cases and Error Handling

| # | Test Case | Steps | Expected Result | Status | Tester | Date |
|---|-----------|-------|-----------------|--------|--------|------|
| 11.1 | App loads without backend running | 1. Stop the Express server 2. Load the frontend | Map renders with basemap tiles; data layers fail gracefully with no crash | | | |
| 11.2 | Slow network simulation | 1. Open DevTools > Network > Throttle to "Slow 3G" 2. Interact with the map | Loading indicators appear, no UI freezing or unhandled errors | | | |
| 11.3 | Rapid search input | 1. Type rapidly in the search bar (e.g., paste a long string) | Debounce prevents excessive API calls; results load correctly after the 280ms debounce delay | | | |
| 11.4 | Place assets at map boundary | 1. In simulation mode, place an asset at the edge of the visible map area | Asset is placed and scored correctly | | | |
| 11.5 | Browser back/forward navigation | 1. Navigate between map and account pages 2. Use browser back/forward buttons | Page state is maintained correctly (app uses internal state, not URL routing for page switching) | | | |

---

## Test Run Log

| Run # | Date | Tester | Browser | Device | Notes |
|-------|------|--------|---------|--------|-------|
| | | | | | |
| | | | | | |
| | | | | | |
