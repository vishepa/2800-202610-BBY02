import { useState, useCallback } from "react";
import Map from "./components/map/map";
import SimulationToolbar from "./components/SimulationToolbar";
import LayerDropdown from "./components/LayerToggleDropdown";
import FeaturePopup from "./components/FeaturePopup";

{/* this is the app JSX, it will contain the main application structure */ }
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("map");

  const [foodLayerVisible, setFoodLayerVisible] = useState(true);
  const [transitLayerVisible, setTransitLayerVisible] = useState(false);

  /* Pop up states */
  const [showWelcome, setShowWelcome] = useState(true);
  const [showSimPopup, setShowSimPopup] = useState(false);
  const [simPopupSeen, setSimPopupSeen] = useState(false);
  const [showSliderPopup, setShowSliderPopup] = useState(false);
  const [sliderPopupSeen, setSliderPopupSeen] = useState(false);

  const handleToggleSidebar = () => {
    const opening = !sidebarOpen;
    if (opening && !sliderPopupSeen) {
      setShowSliderPopup(true);
      setSliderPopupSeen(true);
    }
    setSidebarOpen(opening);
  };

  const handleSetActive = useCallback((mode) => {
    if (mode === "sim" && !simPopupSeen) {
      setShowSimPopup(true);
      setSimPopupSeen(true);
    }
    setActive(mode);
  }, [simPopupSeen]);

  return (
    <div className="relative w-full h-screen">

      {/* Map */}
      <div className={`absolute inset-0 transition-all duration-300 ${sidebarOpen ? "pl-85" : "pl-0"}`}>
        <Map
          active={active}
          setActive={setActive}
          foodLayerVisible={foodLayerVisible}
          transitLayerVisible={transitLayerVisible}
        />
      </div>

      {/* Sidebar */}
      <div className={`absolute top-0 left-0 h-full w-85 z-10 bg-white shadow-lg transition-transform duration-300 overflow-visible ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SimulationToolbar active={active} setActive={handleSetActive} />
      </div>

      {/* Toggle sidebar */}
      <button
        onClick={handleToggleSidebar}
        className={`absolute top-1/2 z-20 bg-white shadow-md minimum-height-20 rounded-r-lg px-1 py-3 transition-all duration-300 ${sidebarOpen ? `left-85` : "left-0"}`}
      >
        {sidebarOpen ? "<<" : ">>"}
      </button>

      <div className="absolute top-16 right-0 z-30">
        <LayerDropdown
          toggles={[
            { id: 'food', label: 'Food assets', visible: foodLayerVisible, onToggle: setFoodLayerVisible },
            { id: 'transit', label: 'Transit stops', visible: transitLayerVisible, onToggle: setTransitLayerVisible },
          ]}
        />
      </div>

      {showWelcome && (
        <FeaturePopup title="Welcome to the Vancouver Food Accessibility Map" onClose={() => setShowWelcome(false)}>
          <p className="mb-2">This interactive map visualizes food accessibility across Vancouver neighborhoods using a a variety of layers.</p>
          <p>Each area on the map represents a dissemination area scored by proximity to grocery stores, community gardens, farmers markets, and transit access. Explore the map to find underserved areas and identify where new food sources could have the most impact.</p>
        </FeaturePopup>
      )}

      {showSimPopup && (
        <FeaturePopup title="Simulation Mode" onClose={() => setShowSimPopup(false)}>
          <p>Place hypothetical food assets like grocery stores, community gardens, or farmers markets anywhere on the map to see how they would change food accessibility scores in surrounding neighborhoods.</p>
        </FeaturePopup>
      )}

      {showSliderPopup && (
        <FeaturePopup title="Weight Sliders" onClose={() => setShowSliderPopup(false)}>
          <p>Adjust how much each factor weighs in the accessibility score. Increase or decrease the importance of transit access, food price, proximity, and other aspects to explore different scenarios.</p>
        </FeaturePopup>
      )}
    </div>
  );
}