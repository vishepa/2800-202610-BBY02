import { useState, useCallback, useMemo, useEffect } from "react";
import Map from "./Map.jsx";
import SimulationToolbar from "./SimulationToolbar";
import FilterDropdown from "./FilterDropdown";
import FeaturePopup from "./FeaturePopup";
import TogglePage from "../shared/TogglePage.jsx";
import { useDisseminationAreas } from "../../lib/hooks/useDisseminationAreas";
import { useFoodAssets } from "../../lib/hooks/useFoodAssets";
import { applySimulation } from "../../lib/scoring";
import { applyCoverage, COVERAGE_BUFFER_KM } from "../../lib/coverage";
import { useScreenWidth } from "../shared/widthHelper";
import { useAuth } from "../shared/authentication/AuthContext";

function tutorialKey(userId, name) {
    return `tutorial_seen_${userId}_${name}`;
}

function hasSeen(userId, name) {
    if (!userId) return false;
    return localStorage.getItem(tutorialKey(userId, name)) === "1";
}

function markSeen(userId, name) {
    if (!userId) return;
    localStorage.setItem(tutorialKey(userId, name), "1");
}

export default function MapPage({ setPage, placedAssets, setPlacedAssets, coverageMode, onExitCoverage }) {
    const { user } = useAuth();
    const uid = user?.id;

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [active, setActive] = useState("map");
    // Manual show/hide toggle for the simulation, used while in Sim mode.
    const [simVisible, setSimVisible] = useState(true);

    const [showWelcome, setShowWelcome] = useState(true);
    const [showSimPopup, setShowSimPopup] = useState(false);
    const [simPopupSeen, setSimPopupSeen] = useState(false);
    const [showSliderPopup, setShowSliderPopup] = useState(false);
    const [sliderPopupSeen, setSliderPopupSeen] = useState(false);

    const [scoreWeights, setScoreWeights] = useState({
        incomeWeight: 1,
        programWeight: 1,
        transitWeight: 1,
    });

    useEffect(() => {
        if (!uid) return;
        if (hasSeen(uid, "welcome")) setShowWelcome(false);
        if (hasSeen(uid, "sim")) setSimPopupSeen(true);
        if (hasSeen(uid, "slider")) setSliderPopupSeen(true);
    }, [uid]);

    // Layer visibility state lifted up from map.jsx
    const [foodLayerVisible, setFoodLayerVisible] = useState(true);
    const [transitLayerVisible, setTransitLayerVisible] = useState(true);
    const [disseminationLayerVisible, setDisseminationLayerVisible] = useState(true);

    const [selectedCategory, setSelectedCategory] = useState(null); // null means "all types"
    // placedAssets is lifted to App so a saved simulation can be restored
    // from the account page — see App.jsx.
    // const [selectedDA, setSelectedDA] = useState(null); // clicked dissemination area
    const [selectedItem, setSelectedItem] = useState(null); // clicked dissemination area/food asset

    const { data: baselineDA } = useDisseminationAreas();
    // Also fetched in Map.jsx for clustering. Browser-side this dedupes
    // to a single response thanks to HTTP caching
    // The duplicate hook keeps the easter egg additive without restructuring Map's props.
    const { data: foodData } = useFoodAssets();

    // In Map view the map falls back to the untouched baseline data.
    const simShownOnMap = active === "sim" && simVisible && !coverageMode;

    // Deferring the calculation lets the click register and the banner appear in the
    // same frame the recoloured DAs follow a sec later
    const [coverageDA, setCoverageDA] = useState(null);
    const [coverageComputing, setCoverageComputing] = useState(false);

    // Deliberately don't reset coverageDA when coverageMode flips
    // off, keeping it lets a quick off to on toggle
    // reuse the previous result for one frame before the recompute lands.
    useEffect(() => {
        if (!coverageMode || !baselineDA || !foodData) return undefined;

        let cancelled = false;
        setCoverageComputing(true);
        const handle = setTimeout(() => {
            if (cancelled) return;
            const result = applyCoverage(baselineDA, foodData);
            if (cancelled) return;
            setCoverageDA(result);
            setCoverageComputing(false);
        }, 0);

        return () => {
            cancelled = true;
            clearTimeout(handle);
        };
    }, [coverageMode, baselineDA, foodData]);

    const disseminationData = useMemo(() => {
        if (coverageMode) return coverageDA ?? baselineDA;
        if (simShownOnMap) return applySimulation(baselineDA, placedAssets);
        return baselineDA;
    }, [coverageMode, coverageDA, baselineDA, placedAssets, simShownOnMap]);

    const handleSelectDA = useCallback((daFeature) => {
        setSelectedItem(daFeature ? { type: 'da', data: daFeature } : null);
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
     // Deselect after placing — single-click placement mode.
        setSelectedCategory(null);
    }, [setPlacedAssets]);

    const removePlacedAsset = useCallback((id) => {
        setPlacedAssets(prev => prev.filter(a => a.id !== id));
    }, [setPlacedAssets]);

    const clearPlacedAssets = useCallback(() => {
        setPlacedAssets([]);
    }, [setPlacedAssets]);

    const handleToggleSidebar = () => {
        const opening = !sidebarOpen;
        if (opening && !sliderPopupSeen) {
            setShowSliderPopup(true);
            setSliderPopupSeen(true);
            markSeen(uid, "slider");
        }
        setSidebarOpen(opening);
    };

    const handleSetActive = useCallback((mode) => {
        if (mode === "sim") {
            if (!simPopupSeen) {
                setShowSimPopup(true);
                setSimPopupSeen(true);
                markSeen(uid, "sim");
            }
            // Entering Sim mode opens the panel and reveals the simulation.
            setSidebarOpen(true);
            setSimVisible(true);
        }
        setActive(mode);
    }, [simPopupSeen, uid]);

    const width = useScreenWidth();
    const isDesktop = width >= 760;

    const toggles = [
        { id: "food", label: "Food Assets", visible: foodLayerVisible, onToggle: setFoodLayerVisible },
        { id: "transit", label: "Transit Stops", visible: transitLayerVisible, onToggle: setTransitLayerVisible },
        { id: "dissemination", label: "Dissemination Areas", visible: disseminationLayerVisible, onToggle: setDisseminationLayerVisible },
    ];

    return (
        <>
            <div className="relative w-full h-full">
                <Map
                    active={active}
                    setActive={handleSetActive}
                    setPage={setPage}
                    foodLayerVisible={foodLayerVisible}
                    transitLayerVisible={transitLayerVisible}
                    disseminationLayerVisible={disseminationLayerVisible}
                    disseminationData={disseminationData}
                    selectedCategory={selectedCategory}
                    scoreWeights={scoreWeights}
                    placedAssets={placedAssets}
                    addPlacedAsset={addPlacedAsset}
                    showSimulation={simShownOnMap}
                    coverageMode={coverageMode}
                    foodFCForCoverage={coverageMode ? foodData : null}
                    selectedItem={selectedItem}
                    setSelectedDA={handleSelectDA}
                    setSelectedFoodAsset={handleSelectFoodAsset}
                    setSelectedTransitStop={handleSelectTransitStop}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                />
            </div>

            <TogglePage page={active} setPage={setPage} sidebarOpen={sidebarOpen} />

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
                                scoreWeights={scoreWeights}
                                setScoreWeights={setScoreWeights}
                                placedAssets={placedAssets}
                                removePlacedAsset={removePlacedAsset}
                                clearPlacedAssets={clearPlacedAssets}
                                simVisible={simVisible}
                                setSimVisible={setSimVisible}
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
                                scoreWeights={scoreWeights}
                                setScoreWeights={setScoreWeights}
                                placedAssets={placedAssets}
                                removePlacedAsset={removePlacedAsset}
                                clearPlacedAssets={clearPlacedAssets}
                                simVisible={simVisible}
                                setSimVisible={setSimVisible}
                                selectedItem={selectedItem}
                            />
                        </div>
                    </div>
                </>
            )}

            <div className="absolute top-0 right-0 z-30">
                <FilterDropdown toggles={toggles} />
            </div>

            {/* Easter egg banner — top-center on mobile  and bottom-center on desktop . Subtitle collapses to icons on small screens. */}
            {coverageMode && (
                <div className="absolute md:bottom-4 md:top-auto top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 sm:gap-3 bg-white/95 backdrop-blur shadow-lg rounded-full px-3 sm:px-4 py-2 border border-green-500/50 max-w-[calc(100vw-1rem)]">
                    <span className={`text-xl shrink-0 ${coverageComputing ? "animate-pulse" : ""}`}>🧅</span>
                    <div className="text-sm leading-tight min-w-0">
                        <div className="font-semibold text-gray-800 whitespace-nowrap">15-Minute City</div>
                        <div className="hidden sm:block text-gray-500 text-xs">
                            {coverageComputing
                                ? "Calculating walking reach…"
                                : `${Math.round(COVERAGE_BUFFER_KM * 1000)}m walk · green = fully reached · red = food desert`}
                        </div>
                        <div className="sm:hidden text-gray-500 text-xs">
                            {coverageComputing ? "Calculating…" : `${Math.round(COVERAGE_BUFFER_KM * 1000)}m walking reach`}
                        </div>
                    </div>
                    <button
                        onClick={onExitCoverage}
                        aria-label="Exit 15-minute city view"
                        className="ml-1 sm:ml-2 px-2.5 sm:px-3 py-1 text-xs font-medium rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer shrink-0"
                    >
                        <span className="hidden sm:inline">Back to normal</span>
                        <span className="sm:hidden">Exit</span>
                    </button>
                </div>
            )}

            {showWelcome && (
                <FeaturePopup title="Welcome to the Vancouver Food Accessibility Map" onClose={() => { setShowWelcome(false); markSeen(uid, "welcome"); }}>
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
