import { useState, useCallback, useMemo } from "react";
import Map from "./Map.jsx";
import SimulationToolbar from "./SimulationToolbar";
import FilterDropdown from "./FilterDropdown";
import FeaturePopup from "./FeaturePopup";
import TogglePage from "../shared/TogglePage.jsx";
import { useDisseminationAreas } from "../../lib/hooks/useDisseminationAreas";
import { applySimulation } from "../../lib/scoring";
import { useScreenWidth } from "../shared/widthHelper";

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

    const [selectedCategory, setSelectedCategory] = useState(null); // null means "all types"
    const [placedAssets, setPlacedAssets] = useState([]);
    // const [selectedDA, setSelectedDA] = useState(null); // clicked dissemination area
    const [selectedItem, setSelectedItem] = useState(null); // clicked dissemination area/food asset

    const { data: baselineDA } = useDisseminationAreas();
    const disseminationData = useMemo(
        () => applySimulation(baselineDA, placedAssets),
        [baselineDA, placedAssets],
    );

    const handleSelectDA = useCallback((daProperties) => {
        setSelectedItem(daProperties ? { type: 'da', data: daProperties } : null);
    }, []);

    const handleSelectFoodAsset = useCallback((assetProperties) => {
        setSelectedItem(assetProperties ? { type: 'foodAsset', data: assetProperties } : null);
    }, []);

    const handleSelectTransitStop = useCallback((stopProperties) => {
        setSelectedItem(stopProperties ? { type: 'transitStop', data: stopProperties } : null);
    }, []);

    const addPlacedAsset = useCallback((category, lat, lng) => {
        setPlacedAssets(prev => [
            ...prev,
        {
             id: crypto.randomUUID(),
             category,
             lat,
             lng,
         },
     ]);
     // Deselect after placing single-click placement mode.
        setSelectedCategory(null);
    }, []);

    const removePlacedAsset = useCallback((id) => {
        setPlacedAssets(prev => prev.filter(a => a.id !== id));
    }, []);

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

    const width = useScreenWidth();
    const isDesktop = width >= 760;

    const toggles = [
        { id: "food", label: "Food Assets", visible: foodLayerVisible, onToggle: setFoodLayerVisible },
        { id: "transit", label: "Transit Stops", visible: transitLayerVisible, onToggle: setTransitLayerVisible },
        { id: "dissemination", label: "Dissemination Areas", visible: disseminationLayerVisible, onToggle: setDisseminationLayerVisible },
    ];

    return (
        <>

            <div className={`relative w-full h-full transition-all duration-300 ${sidebarOpen ? "pl-95" : "pl-0"}`}>
                <Map
                    active={active}
                    setActive={handleSetActive}
                    setPage={setPage}
                    foodLayerVisible={foodLayerVisible}
                    transitLayerVisible={transitLayerVisible}
                    disseminationLayerVisible={disseminationLayerVisible}
                    disseminationData={disseminationData}
                    selectedCategory={selectedCategory}
                    placedAssets={placedAssets}
                    addPlacedAsset={addPlacedAsset}
                    selectedItem={selectedItem}
                    setSelectedDA={handleSelectDA}
                    setSelectedFoodAsset={handleSelectFoodAsset}
                    setSelectedTransitStop={handleSelectTransitStop}
                    setSidebarOpen={setSidebarOpen}
                />
            </div>
            
            <TogglePage page={active} setPage={(p) => { console.log("setPage called with", p); setPage(p); }} sidebarOpen={sidebarOpen} />

            {/* Desktop: slide from left */}
            {isDesktop ? (
                <>
                    <div className={`absolute top-0 left-0 h-full w-95 z-10 bg-white shadow-lg transition-transform duration-300 will-change-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                        <div className="h-full overflow-y-auto">
                            <SimulationToolbar
                                active={active}
                                setActive={handleSetActive}
                                selectedCategory={selectedCategory}
                                setSelectedCategory={setSelectedCategory}
                                placedAssets={placedAssets}
                                removePlacedAsset={removePlacedAsset}
                                selectedItem={selectedItem}
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleToggleSidebar}
                        className={`absolute top-1/2 z-20 bg-white shadow-md rounded-r-lg px-1 py-3 transition-all duration-300 ${sidebarOpen ? "left-95" : "left-0"}`}
                    >
                        {sidebarOpen ? "<<" : ">>"}
                    </button>
                </>
            ) : (
                <>
                    {/* Mobile: slide from bottom */}
                    <div className={`absolute bottom-0 left-0 w-full h-2/3 z-10 bg-white shadow-lg rounded-t-2xl transition-transform duration-300 will-change-transform ${sidebarOpen ? "translate-y-0" : "translate-y-full"}`}>
                        <div className="h-full overflow-y-auto p-4">
                            <div className="flex justify-center mb-2">
                                <button
                                    onClick={handleToggleSidebar}
                                    className="w-10 h-1.5 bg-gray-300 rounded-full"
                                />
                            </div>
                            <SimulationToolbar
                                active={active}
                                setActive={handleSetActive}
                                selectedCategory={selectedCategory}
                                setSelectedCategory={setSelectedCategory}
                                placedAssets={placedAssets}
                                removePlacedAsset={removePlacedAsset}
                                selectedItem={selectedItem}
                            />
                        </div>
                    </div>
                </>
            )}

            <div className="absolute top-0 right-0 z-30">
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