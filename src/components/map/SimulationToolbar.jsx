import { useState } from "react";
import { useScreenWidth } from "../shared/widthHelper";
import { useAuth } from "../shared/authentication/AuthContext.jsx";
import MapSimButtonMobile from "./MapSimButtonMobile";
import Tooltip from "./Tooltip";
import IconPicker from "./simulation/IconPicker";
import PlacedAssetList from "./simulation/PlacedAssetList";
import SaveSimulationModal from "./simulation/SaveSimulationModal";
import DAInfoPanel from "./DAInfoPanel";
import FoodInfoPanel from "./FoodInfoPanel";
import TransitInfoPanel from "./TransitInfoPanel";
import LoginSignupPopup from "../account/LoginSignupPopup.jsx";

export function SimulationToolbar({
    active,
    setActive,
    selectedCategory,
    setSelectedCategory,
    placedAssets,
    removePlacedAsset,
    clearPlacedAssets,
    simVisible,
    setSimVisible,
    selectedItem,
}) {

    const [pct, setPct] = useState(50);
    const [something, setSomething] = useState(50);
    const [another, setAnother] = useState(50);
    const [yetAnother, setYetAnother] = useState(50);

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
            <p><Tooltip text="How important nearby transit stops are to the accessibility score">slider1 : {pct}</Tooltip></p>
            <input type="range" min={0} max={100} value={pct}
                onChange={(e) => setPct(Number(e.target.value))}
                className="accent-blue-600 w-full h-1 rounded-full cursor-pointer"
                style={trackStyle} />

            <p><Tooltip text="How much food price and affordability affect the score">slider2 : {something}</Tooltip></p>
            <input type="range" min={0} max={100} value={something}
                onChange={(e) => setSomething(Number(e.target.value))}
                className="accent-blue-600 w-full h-1 rounded-full cursor-pointer"
                style={trackStyle} />

            <p><Tooltip text="How much walking distance to food sources matters">slider3 : {another}</Tooltip></p>
            <input type="range" min={0} max={100} value={another}
                onChange={(e) => setAnother(Number(e.target.value))}
                className="accent-blue-600 w-full h-1 rounded-full cursor-pointer"
                style={trackStyle} />

            <p><Tooltip text="How much neighborhood population density factors in">slider4 : {yetAnother}</Tooltip></p>
            <input type="range" min={0} max={100} value={yetAnother}
                onChange={(e) => setYetAnother(Number(e.target.value))}
                className="accent-blue-600 w-full h-1 rounded-full cursor-pointer"
                style={trackStyle} />
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
            return <DAInfoPanel properties={selectedItem.data.properties} />;
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
                    className="flex-1 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded-lg transition-colors"
                >
                    {simVisible ? "Hide" : "Show"} Simulation
                </button>
            </div>
            <button
                type="button"
                onClick={handleSaveClick}
                className="mt-2 w-full py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
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
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4">
                    {active === "sim" ? "Simulation Toolbar" : "Map Data Display"}
                </h2>
                {active === "sim" ? simContent : daInfoContent}
            </div>
        );
    } else {
        return (
            <div className="flex flex-col h-full p-4">
                <div className="flex-1 p-4">
                    <h2 className="text-xl font-bold mb-4">
                        {active === "sim" ? "Simulation Toolbar" : "Map Data Display"}
                    </h2>
                    {active === "sim" ? simContent : daInfoContent}
                </div>
                <MapSimButtonMobile active={active} setActive={setActive} />
            </div>
        );
    }
}

export default SimulationToolbar;
