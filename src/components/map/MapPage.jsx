import { useState, useCallback } from "react";
import Map from "./Map.jsx";
import SimulationToolbar from "./SimulationToolbar";
import FilterDropdown from "./FilterDropdown";
import FeaturePopup from "./FeaturePopup";
import TogglePage from "../shared/TogglePage.jsx";

export default function MapPage({ setPage }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [active, setActive] = useState("map");

    const [showWelcome, setShowWelcome] = useState(true);
    const [showSimPopup, setShowSimPopup] = useState(false);
    const [simPopupSeen, setSimPopupSeen] = useState(false);
    const [showSliderPopup, setShowSliderPopup] = useState(false);
    const [sliderPopupSeen, setSliderPopupSeen] = useState(false);

    // Layer visibility state lifted up from map.jsx
    const [foodLayerVisible, setFoodLayerVisible] = useState(true);
    const [transitLayerVisible, setTransitLayerVisible] = useState(true);
    const [disseminationLayerVisible, setDisseminationLayerVisible] = useState(true);

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

    const toggles = [
        { id: "food", label: "Food Assets", visible: foodLayerVisible, onToggle: setFoodLayerVisible },
        { id: "transit", label: "Transit Stops", visible: transitLayerVisible, onToggle: setTransitLayerVisible },
        { id: "dissemination", label: "Dissemination Areas", visible: disseminationLayerVisible, onToggle: setDisseminationLayerVisible },
    ];

    return (
        <>
            <div className={`w-full h-full transition-all duration-300 ${sidebarOpen ? "pl-95" : "pl-0"}`}>
                <Map
                    active={active}
                    setActive={handleSetActive}
                    setPage={setPage}
                    foodLayerVisible={foodLayerVisible}
                    transitLayerVisible={transitLayerVisible}
                    disseminationLayerVisible={disseminationLayerVisible}
                />
            </div>
            
            <TogglePage page={active} setPage={setPage} sidebarOpen={sidebarOpen} />

            <div className={`absolute top-0 left-0 h-full w-95 z-10 bg-white shadow-lg transition-transform duration-300 overflow-visible ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <SimulationToolbar active={active} setActive={handleSetActive} />
            </div>

            <button
                onClick={handleToggleSidebar}
                className={`absolute top-1/2 z-20 bg-white shadow-md rounded-r-lg px-1 py-3 transition-all duration-300 ${sidebarOpen ? "left-95" : "left-0"}`}
            >
                {sidebarOpen ? "<<" : ">>"}
            </button>

            <div className="absolute right-0 z-30">
                <FilterDropdown toggles={toggles} />
            </div>

            {showWelcome && (
                <FeaturePopup title="Welcome to the Vancouver Food Accessibility Map" onClose={() => setShowWelcome(false)}>
                    <p className="mb-2">This interactive map visualizes food accessibility across Vancouver neighborhoods using a variety of layers.</p>
                    <p>Each area on the map represents a dissemination area scored by proximity to grocery stores, community gardens, farmers markets, and transit access.</p>
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
        </>
    );
}