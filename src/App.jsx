import { useState, useCallback } from "react";
import MapPage from "./components/map/MapPage";
import AccountPage from "./components/account/account";
import Header from "./components/shared/Header.jsx";

export default function App() {
  const [page, setPage] = useState("map");

  // Placed assets are lifted up from MapPage so they persist across the
  // map to account page switch and can be restored when loading a saved one.
  const [placedAssets, setPlacedAssets] = useState([]);

  // Easter egg: 15-minute-city coverage view, toggled from the header
  // onion. Lifted to App so the trigger lives next to the site logo while
  // the rendering happens inside MapPage.
  const [coverageMode, setCoverageMode] = useState(false);
  const toggleCoverage = useCallback(() => setCoverageMode(v => !v), []);

  // Restore a saved simulation onto the map and switch to the map view.
  const loadSimulation = useCallback((sim) => {
    setPlacedAssets(sim.placed_assets ?? []);
    setPage("map");
  }, []);

  return (
    <div className="flex flex-col w-full h-screen">
      <Header
        sidebarOpen={useState(false)}
        coverageMode={coverageMode}
        onToggleCoverage={toggleCoverage}
      />
      <div className="flex-1 relative overflow-hidden">
        { page === "account" ? (
          <AccountPage
            onBack={() => setPage("map")}
            page={page}
            setPage={setPage}
            loadSimulation={loadSimulation}
          />
        ) : (
          <MapPage
            page={page}
            setPage={setPage}
            placedAssets={placedAssets}
            setPlacedAssets={setPlacedAssets}
            coverageMode={coverageMode}
            onExitCoverage={() => setCoverageMode(false)}
          />
        )}
      </div>
    </div>
  );
}
