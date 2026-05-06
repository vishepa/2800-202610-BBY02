import { useState } from "react";

export function SimulationToolbar({ active }) {
    const [pct, setPct] = useState(50);
    const [something, setSomething] = useState(50);
    const [another, setAnother] = useState(50);
    const [yetAnother, setYetAnother] = useState(50);

    const trackStyle = {
        background: `linear-gradient(to right, #2563eb ${pct}%, #bfdbfe ${pct}%)`,
    };

    if (active === "sim") {
        return (
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Simulation Toolbar</h2>

                <p>slider1 : {pct}</p>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={pct}
                    onChange={(e) => setPct(Number(e.target.value))}
                    className="accent-blue-600 w-full h-1 rounded-full cursor-pointer"
                    style={trackStyle}
                />

                <p>slider2 : {something}</p>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={something}
                    onChange={(e) => setSomething(Number(e.target.value))}
                    className="accent-blue-600 w-full h-1 rounded-full cursor-pointer"
                    style={trackStyle}
                />

                <p>slider3 : {another}</p>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={another}
                    onChange={(e) => setAnother(Number(e.target.value))}
                    className="accent-blue-600 w-full h-1 rounded-full cursor-pointer"
                    style={trackStyle}
                />

                <p>slider4 : {yetAnother}</p>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={yetAnother}
                    onChange={(e) => setYetAnother(Number(e.target.value))}
                    className="accent-blue-600 w-full h-1 rounded-full cursor-pointer"
                    style={trackStyle}
                />
            </div>
        );
    } else {
        return (
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Simulation Toolbar</h2>
                <p>see a bunch of stats when hovering over map</p>
            </div>
        );
    }
}

export default SimulationToolbar;