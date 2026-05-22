import { useState, useCallback, useMemo, useEffect } from "react";
import Map from "./Map.jsx";
import SimulationToolbar from "./SimulationToolbar";
import FilterDropdown from "./FilterDropdown";
import FeaturePopup from "./FeaturePopup";
import TogglePage from "../shared/TogglePage.jsx";
import { useDisseminationAreas } from "../../lib/hooks/useDisseminationAreas";
import { applySimulation } from "../../lib/scoring";
import { useScreenWidth } from "../shared/useScreenWidth";
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

// Lighter, cream-paper filter for heritage mode — the previous heavier
// sepia read as "stained" rather than "old printed paper". Paired with
// the cream multiply-blend overlay below to land on the parchment look
// from the 1974 reference map.
const HERITAGE_FILTER = "sepia(0.35) saturate(0.9) brightness(1.05) contrast(0.95) hue-rotate(-5deg)";
const TYPEWRITER_FONT = "'Special Elite', 'Courier New', Courier, monospace";

// Default starting value for the isochrone slider. Used both to initialize
// state below and to detect "user hasn't touched the slider" in the
// simulation gating logic — staying at this value keeps Sim view colors
// identical to Map view.
const DEFAULT_ISOCHRONE_MINUTES = 10;

export default function MapPage({ setPage, placedAssets, setPlacedAssets, focusSignal, heritageMode, onExitHeritage }) {
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

    // null = every category visible; an array narrows the food-asset
    // cluster index. Lifted here so the FoodTypeFilter UI (rendered
    // inside SimulationToolbar) and the Map's data layer share one
    // source of truth.
    const [activeFoodCategories, setActiveFoodCategories] = useState(null);

    const [scoreWeights, setScoreWeights] = useState({
        incomeWeight: 1,
        programWeight: 1,
        transitWeight: 1,
    });

    const [isochroneMinutes, setIsochroneMinutes] = useState(DEFAULT_ISOCHRONE_MINUTES);

    useEffect(() => {
        if (!uid) return;
        if (hasSeen(uid, "welcome")) setShowWelcome(false);
        if (hasSeen(uid, "sim")) setSimPopupSeen(true);
        if (hasSeen(uid, "slider")) setSliderPopupSeen(true);
    }, [uid]);

    // Layer visibility state lifted up from map.jsx
    const [foodLayerVisible, setFoodLayerVisible] = useState(true);
    // Transit starts hidden — most users care about food access first, and
    // the transit stop layer is dense enough to crowd the map on entry.
    const [transitLayerVisible, setTransitLayerVisible] = useState(false);
    const [disseminationLayerVisible, setDisseminationLayerVisible] = useState(true);

    const [selectedCategory, setSelectedCategory] = useState(null); // null means "all types"
    // placedAssets is lifted to App so a saved simulation can be restored
    // from the account page — see App.jsx.
    // const [selectedDA, setSelectedDA] = useState(null); // clicked dissemination area
    const [selectedItem, setSelectedItem] = useState(null); // clicked dissemination area/food asset

    const { data: baselineDA } = useDisseminationAreas();
    // The simulation (placed assets + recolored DA scores) only shows in Sim
    // mode, and can be toggled off manually within it. In Map view the map
    // falls back to the untouched baseline data.
    const simShownOnMap = active === "sim" && simVisible;
    // Entering Sim mode shouldn't repaint the map on its own — applySimulation
    // reads walk_Nmin_score as the base, which differs from baseline
    // normalized_da_score even at default weights/iso. So we only run the
    // simulation transform when the user has actually changed something:
    // placed an asset, moved a weight slider, or moved the isochrone slider
    // off DEFAULT_ISOCHRONE_MINUTES. Otherwise the baseline data flows
    // through and Sim view matches Map view exactly.
    const hasActiveSim =
        (placedAssets?.length ?? 0) > 0 ||
        scoreWeights.incomeWeight !== 1 ||
        scoreWeights.programWeight !== 1 ||
        isochroneMinutes !== DEFAULT_ISOCHRONE_MINUTES;
    const disseminationData = useMemo(
        () => (simShownOnMap && hasActiveSim
            ? applySimulation(baselineDA, placedAssets, scoreWeights, isochroneMinutes)
            : baselineDA),
        [baselineDA, placedAssets, simShownOnMap, hasActiveSim, scoreWeights, isochroneMinutes],
    );

    // Brief "Vancouver, if planners had MapLibre in 1974." card. Fades in
    // when the mode flips on, holds for a few seconds, then fades out
    // while the heritage view itself stays active.
    const [heritageOverlayVisible, setHeritageOverlayVisible] = useState(false);
    useEffect(() => {
        if (!heritageMode) {
            setHeritageOverlayVisible(false);
            return undefined;
        }
        setHeritageOverlayVisible(true);
        const timeoutId = setTimeout(() => setHeritageOverlayVisible(false), 3500);
        return () => clearTimeout(timeoutId);
    }, [heritageMode]);

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

    // Loading a saved simulation from the account page bumps focusSignal.
    // Drop the user straight into Sim mode so the placed assets are visible.
    // We intentionally bypass handleSetActive here so the one-time "Simulation
    // Mode" tutorial popup doesn't fire — the user is loading a saved sim,
    // they already know what Sim mode is.
    useEffect(() => {
        if (!focusSignal) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- responding to a parent signal
        setActive("sim");
        // eslint-disable-next-line react-hooks/set-state-in-effect -- responding to a parent signal
        setSidebarOpen(true);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- responding to a parent signal
        setSimVisible(true);
    }, [focusSignal]);

    const width = useScreenWidth();
    const isDesktop = width >= 760;

    const toggles = [
        { id: "food", label: "Food Assets", visible: foodLayerVisible, onToggle: setFoodLayerVisible },
        { id: "transit", label: "Transit Stops", visible: transitLayerVisible, onToggle: setTransitLayerVisible },
        { id: "dissemination", label: "Dissemination Areas", visible: disseminationLayerVisible, onToggle: setDisseminationLayerVisible },
    ];

    return (
        <>
            {/* Cream-paper filter is applied to this wrapper only, so the
                basemap and deck.gl canvas both pick it up while the sidebar
                / overlay / exit pill sit outside and stay crisp. The
                multiply-blend cream overlay tints the basemap toward
                parchment without dulling the DA polygons' 1974 fills,
                which are painted at a higher alpha. */}
            <div
                className="relative w-full h-full transition-[filter] duration-700 ease-out"
                style={{ filter: heritageMode ? HERITAGE_FILTER : "none" }}
            >
                <Map
                    active={active}
                    setActive={handleSetActive}
                    setPage={setPage}
                    foodLayerVisible={foodLayerVisible}
                    transitLayerVisible={transitLayerVisible}
                    disseminationLayerVisible={disseminationLayerVisible}
                    disseminationData={disseminationData}
                    selectedCategory={selectedCategory}
                    activeFoodCategories={activeFoodCategories}
                    scoreWeights={scoreWeights}
                    isochroneMinutes={isochroneMinutes}
                    setIsochroneMinutes={setIsochroneMinutes}
                    placedAssets={placedAssets}
                    addPlacedAsset={addPlacedAsset}
                    showSimulation={simShownOnMap}
                    focusSignal={focusSignal}
                    heritageMode={heritageMode}
                    selectedItem={selectedItem}
                    setSelectedDA={handleSelectDA}
                    setSelectedFoodAsset={handleSelectFoodAsset}
                    setSelectedTransitStop={handleSelectTransitStop}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                />
                {heritageMode && (
                    <div
                        aria-hidden
                        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
                        style={{ backgroundColor: '#f4ebd8', mixBlendMode: 'multiply', opacity: 0.35 }}
                    />
                )}
            </div>

            {/* Mobile-only floating account button. Header renders the
                desktop variant with placement="header"; CSS hides
                whichever doesn't match the viewport. */}
            <TogglePage
                page={active}
                setPage={setPage}
                sidebarOpen={sidebarOpen}
                placement="floating"
            />

            {/* Side panels + toggles pick up cream / sepia in heritage mode
                so the chrome stays cohesive with the parchment map. Colour
                transition matches the map filter's 700ms ease-out so they
                morph together. */}
            {isDesktop ? (
                <>
                    {/* Desktop: slide from left */}
                    <div className={`absolute top-0 left-0 h-full w-95 z-30 shadow-lg transition-[transform,background-color,border-color] duration-700 will-change-transform ${
                        sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } ${heritageMode ? "bg-[#f4ebd8] border-r-2 border-[#5d4037]/30" : "bg-white"}`}>
                        <div
                            className="h-full overflow-y-auto"
                            // Typewriter font inherits down through the entire toolbar
                            // (info panels, sliders, buttons, AI summary text). None of
                            // those children set font-family explicitly, so the cascade
                            // hits them automatically.
                            style={heritageMode ? { fontFamily: TYPEWRITER_FONT } : undefined}
                        >
                            <SimulationToolbar
                                active={active}
                                setActive={handleSetActive}
                                selectedCategory={selectedCategory}
                                setSelectedCategory={setSelectedCategory}
                                scoreWeights={scoreWeights}
                                setScoreWeights={setScoreWeights}
                                isochroneMinutes={isochroneMinutes}
                                setIsochroneMinutes={setIsochroneMinutes}
                                placedAssets={placedAssets}
                                removePlacedAsset={removePlacedAsset}
                                clearPlacedAssets={clearPlacedAssets}
                                simVisible={simVisible}
                                setSimVisible={setSimVisible}
                                selectedItem={selectedItem}
                                activeFoodCategories={activeFoodCategories}
                                setActiveFoodCategories={setActiveFoodCategories}
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleToggleSidebar}
                        className={`absolute top-1/2 z-5 shadow-md rounded-r-lg px-1 py-3 transition-[left,background-color,color] duration-300 ${
                            sidebarOpen ? "left-95" : "left-0"
                        } ${heritageMode ? "bg-[#f4ebd8] text-[#3e2723]" : "bg-white"}`}
                    >
                        {sidebarOpen ? "<<" : ">>"}
                    </button>
                </>
            ) : (
                <>
                    {/* Mobile: slide from bottom */}
                    <div className={`absolute bottom-0 left-0 w-full h-2/3 z-10 shadow-lg rounded-t-2xl transition-[transform,background-color,border-color] duration-700 will-change-transform ${
                        sidebarOpen ? "translate-y-0" : "translate-y-full"
                    } ${heritageMode ? "bg-[#f4ebd8] border-t-2 border-[#5d4037]/30" : "bg-white"}`}>
                        <div
                            className="h-full overflow-y-auto p-4"
                            style={heritageMode ? { fontFamily: TYPEWRITER_FONT } : undefined}
                        >
                            <div className="flex justify-center mb-2">
                                <button
                                    onClick={handleToggleSidebar}
                                    className={`w-10 h-1.5 rounded-full transition-colors duration-700 ${
                                        heritageMode ? "bg-[#5d4037]/40" : "bg-gray-300"
                                    }`}
                                />
                            </div>
                            <SimulationToolbar
                                active={active}
                                setActive={handleSetActive}
                                selectedCategory={selectedCategory}
                                setSelectedCategory={setSelectedCategory}
                                scoreWeights={scoreWeights}
                                setScoreWeights={setScoreWeights}
                                isochroneMinutes={isochroneMinutes}
                                setIsochroneMinutes={setIsochroneMinutes}
                                placedAssets={placedAssets}
                                removePlacedAsset={removePlacedAsset}
                                clearPlacedAssets={clearPlacedAssets}
                                simVisible={simVisible}
                                setSimVisible={setSimVisible}
                                selectedItem={selectedItem}
                                activeFoodCategories={activeFoodCategories}
                                setActiveFoodCategories={setActiveFoodCategories}
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Layer toggles live in a click-to-expand pill at the top-
                right. On mobile the SearchBar (w-full max-w-sm at top-4
                left-4) stretches under the pill, so we drop the pill to
                top-16 (~64px, clears the ~54px tall SearchBar). At md+
                the SearchBar caps at 384px and there's room beside it,
                so we restore top-4 and the two sit on the same row.
                The food category filter that used to nest here is in
                SimulationToolbar now. */}
            <div className="absolute top-16 right-4 z-5 md:top-4">
                <FilterDropdown toggles={toggles} heritageMode={heritageMode} />
            </div>


            {/* Heritage easter egg: centered intro card + persistent exit pill.
                The card auto-dismisses after a few seconds; the pill stays
                so users who didn't trip the Konami on purpose can get out. */}
            {heritageMode && (
                <>
                    <div
                        className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-1000 ${
                            heritageOverlayVisible ? "opacity-100" : "opacity-0"
                        }`}
                    >
                        <div
                            className="bg-[#f5e9d3]/95 border-2 border-[#5d4037]/40 rounded-md px-6 py-4 shadow-2xl max-w-[90%] text-center"
                            style={{ fontFamily: TYPEWRITER_FONT }}
                        >
                            <p className="text-lg sm:text-xl text-[#3e2723] italic leading-snug">
                                Vancouver Zoning Map, if planners had MapLibre in 1974.
                            </p>
                            <p className="mt-1 text-xs text-[#5d4037]/70 tracking-wider uppercase">
                                — Heatmap Heritage —
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onExitHeritage}
                        aria-label="Exit Heatmap Heritage view"
                        className="absolute bottom-4 left-4 z-30 px-3 py-1.5 text-xs rounded-full bg-[#f5e9d3] border border-[#5d4037]/40 text-[#3e2723] shadow-md hover:bg-[#ecdfc4] cursor-pointer"
                        style={{ fontFamily: TYPEWRITER_FONT }}
                    >
                        ← Back to {new Date().getFullYear()}
                    </button>
                </>
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
