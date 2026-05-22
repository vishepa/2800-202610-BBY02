import { useState } from "react";
import { useScreenWidth } from "../shared/useScreenWidth";
import { useAuth } from "../shared/authentication/AuthContext.jsx";
import MapSimButtonMobile from "./MapSimButtonMobile";
import Tooltip from "./Tooltip";
import FoodTypeFilter from "./FoodTypeFilter.jsx";
import IconPicker from "./simulation/IconPicker";
import PlacedAssetList from "./simulation/PlacedAssetList";
import SaveSimulationModal from "./simulation/SaveSimulationModal";
import DAInfoPanel from "./DAInfoPanel";
import FoodInfoPanel from "./FoodInfoPanel";
import TransitInfoPanel from "./TransitInfoPanel";
import LoginSignupPopup from "../account/LoginSignupPopup.jsx";

function SliderRow({ label, tooltip, value, onChange }) {
    const [showTip, setShowTip] = useState(false);

    return (
        <div className="relative">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <button
                        type="button"
                        className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center hover:bg-gray-300"
                        onMouseEnter={() => setShowTip(true)}
                        onMouseLeave={() => setShowTip(false)}
                    >
                        ?
                    </button>
                    {showTip && (
                        <div className="absolute left-0 top-6 z-50 w-56 bg-gray-800 text-white text-xs rounded px-2 py-1.5 shadow-lg pointer-events-none">
                            {tooltip}
                        </div>
                    )}
                </div>
                <span className="text-xs text-gray-500 tabular-nums">{value.toFixed(2)}×</span>
            </div>
            <input
                type="range"
                min={0} max={200}
                value={value * 100}
                onChange={e => onChange(Number(e.target.value) / 100)}
                className="w-full h-1 rounded-full cursor-pointer accent-blue-600"
                style={{
                    background: `linear-gradient(to right, #2563eb ${value * 50}%, #bfdbfe ${value * 50}%)`
                }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>0×</span>
                <span>1×</span>
                <span>2×</span>
            </div>
        </div>
    );
}

export function SimulationToolbar({
    active,
    setActive,
    selectedCategory,
    setSelectedCategory,
    scoreWeights,
    setScoreWeights,
    isochroneMinutes,
    setIsochroneMinutes,
    placedAssets,
    removePlacedAsset,
    clearPlacedAssets,
    simVisible,
    setSimVisible,
    selectedItem,
    activeFoodCategories,
    setActiveFoodCategories,
}) {

    const [pct, setPct] = useState(50);

    const trackStyle = {
        background: `linear-gradient(to right, #2563eb ${pct}%, #bfdbfe ${pct}%)`,
    };

    const width = useScreenWidth();

    const { user } = useAuth() ?? {};
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLogin, setShowLogin] = useState(false);

    // Logged-in users get the save dialog; everyone else is prompted to log in.
    const handleSaveClick = () => {
        if (user) setShowSaveModal(true);
        else setShowLogin(true);
    };

    const sliders = (
        <>
            <SliderRow
                label="Income Weight"
                tooltip="How much median household income affects retail food access"
                value={scoreWeights.incomeWeight}
                onChange={v => setScoreWeights(w => ({ ...w, incomeWeight: v }))}
            />
            <SliderRow
                label="Food Programs Weight"
                tooltip="How much food program access (pantries, free meals) affects the score"
                value={scoreWeights.programWeight}
                onChange={v => setScoreWeights(w => ({ ...w, programWeight: v }))}
            />
            <div>
                <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Walk Distance</span>
                    <span className="text-xs text-gray-500">{isochroneMinutes} min</span>
                </div>
                <input
                    type="range"
                    min={0} max={2} step={1}
                    value={[5, 10, 15].indexOf(isochroneMinutes)}
                    onChange={e => setIsochroneMinutes([5, 10, 15][Number(e.target.value)])}
                    className="w-full cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400">
                    <span>5 min</span>
                    <span>10 min</span>
                    <span>15 min</span>
                </div>
            </div>
        </>
    );


    const infoContent = (() => {
        if (!selectedItem) {
            return (
                <p className="text-gray-400 text-sm italic">
                    Click a dissemination area, food asset, or transit stop to see details
                </p>
            );
        }
        if (selectedItem.type === 'da') {
            return <DAInfoPanel properties={selectedItem.data.properties} placedAssets={placedAssets} active={active} />;
        }
        if (selectedItem.type === 'foodAsset') {
            return <FoodInfoPanel properties={selectedItem.data} />;
        }
        if (selectedItem.type === 'transitStop') {
            return <TransitInfoPanel properties={selectedItem.data} />;
        }
    })();

    const daInfoContent = (
        <div className="mt-4 pt-4 border-t border-gray-200">
            {infoContent}
        </div>
    );

    const simContent = (
        <>
            {sliders}
            <IconPicker
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
            />
            <PlacedAssetList
                placedAssets={placedAssets}
                removePlacedAsset={removePlacedAsset}
            />
            <div className="mt-4 flex gap-2">
                <button
                    type="button"
                    onClick={clearPlacedAssets}
                    disabled={placedAssets.length === 0}
                    className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-600 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Clear All
                </button>
                <button
                    type="button"
                    onClick={() => setSimVisible(v => !v)}
                    className="flex-1 py-2 bg-blue-100 hover:bg-blue-200 text-green-600 font-semibold rounded-lg transition-colors"
                    style={{fontfamily : "playfair display"}}                
                >
                    {simVisible ? "Hide" : "Show"} Simulation
                </button>
            </div>
            <button
                type="button"
                onClick={handleSaveClick}
                className="mt-2 w-full py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                style={{fontfamily : "playfair display"}}
            >
                Save Simulation
            </button>
            {daInfoContent}

            {showSaveModal && (
                <SaveSimulationModal
                    placedAssets={placedAssets}
                    onClose={() => setShowSaveModal(false)}
                />
            )}
            {showLogin && (
                <LoginSignupPopup onClose={() => setShowLogin(false)} />
            )}
        </>
    );

    if (width >= 760) {
        return (
            <div className="p-4"
                style={{ height: "100%", boxSizing: "border-box" }}>
                <h2 className="text-xl font-bold mb-4 pl-5">
                    {active === "sim" ? "Simulation Toolbar" : "Map Data Display"}
                </h2>
                {active === "sim" ? simContent : (
                    <div>
                        {daInfoContent}
                        <FoodTypeFilter
                            activeCategories={activeFoodCategories}
                            onChange={setActiveFoodCategories}
                        />
                    </div>
                )}
            </div>
        );
    } else {
        return (
            <div className="flex flex-col h-full p-4">
                <div className="flex-1">
                    <h2 className="text-xl font-bold mb-4 pl-5">
                        {active === "sim" ? "Simulation Toolbar" : "Map Data Display"}
                    </h2>
                    {active === "sim" ? simContent : (
                    <div>
                        {daInfoContent}
                        <FoodTypeFilter
                            activeCategories={activeFoodCategories}
                            onChange={setActiveFoodCategories}
                        />
                    </div>
                )}
                </div>
                <MapSimButtonMobile active={active} setActive={setActive} />
            </div>
        );
    }
}

export default SimulationToolbar;
