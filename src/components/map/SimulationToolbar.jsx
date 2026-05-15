import { useState } from "react";
import { useScreenWidth } from "../shared/widthHelper";
import MapSimButton from "./MapSimButton";
import MapSimButtonMobile from "./MapSimButtonMobile";
import Tooltip from "./Tooltip";
import IconPicker from "./simulation/IconPicker";
import PlacedAssetList from "./simulation/PlacedAssetList";
import DAInfoPanel from "./DAInfoPanel";
import FoodInfoPanel from "./FoodInfoPanel";

export function SimulationToolbar({
    active,
    setActive,
    selectedCategory,
    setSelectedCategory,
    placedAssets,
    removePlacedAsset,
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
                    Click a dissemination area or food asset to see details
                </p>
            );
        }
        if (selectedItem.type === 'da') {
            return <DAInfoPanel properties={selectedItem.data} />;
        }
        if (selectedItem.type === 'foodAsset') {
            return <FoodInfoPanel properties={selectedItem.data} />;
        }
    })();

    const daInfoContent = (
        <div className="mt-4 pt-4 border-t border-gray-200">
            {infoContent}
        </div>
    );

    // const daInfoContent = selectedDA ? (
    //     <div className="mt-4 pt-4 border-t border-gray-200">
    //         <DAInfoPanel properties={selectedDA} />
    //     </div>
    // ) : (
    //     <p className="mt-4 text-gray-400 text-sm italic">Click a dissemination area on the map to see details</p>
    // );

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
            {daInfoContent}
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