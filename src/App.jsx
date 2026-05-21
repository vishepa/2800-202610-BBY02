import { useState, useCallback } from "react";
import MapPage from "./components/map/MapPage";
import AccountPage from "./components/account/account";
import Header from "./components/shared/Header.jsx";

export default function App() {
  const [page, setPage] = useState("map");

  // Placed assets are lifted up from MapPage so they persist across the
  // map ↔ account page switch and can be restored when loading a saved one.
  const [placedAssets, setPlacedAssets] = useState([]);

  // Counter that increments every time a saved simulation is loaded. The
  // Map watches this to fit its camera to the placed-asset bounds — a
  // counter (not a boolean) lets the same simulation be re-focused.
  const [focusSignal, setFocusSignal] = useState(0);

  // "Heatmap Heritage" easter egg — Konami-code on the logo (5 taps within
  // a short window) flips the map into a 1970s zoning aesthetic. State
  // lives here so the Header can trip it and the MapPage can render it.
  const [heritageMode, setHeritageMode] = useState(false);
  const triggerHeritage = useCallback(() => setHeritageMode(v => !v), []);

  // Restore a saved simulation onto the map and switch to the map view.
  const loadSimulation = useCallback((sim) => {
    setPlacedAssets(sim.placed_assets ?? []);
    setFocusSignal(n => n + 1);
    setPage("map");
  }, []);

  return (
    <div className="flex flex-col w-full h-screen">
      <Header
        sidebarOpen={useState(false)}
        onSecretToggle={triggerHeritage}
        heritageMode={heritageMode}
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
            focusSignal={focusSignal}
            heritageMode={heritageMode}
            onExitHeritage={() => setHeritageMode(false)}
          />
        )}
      </div>
    </div>
  );
}
