import { useState, useEffect, useRef } from "react";

// Compact "Layers" pill at the top-right of the map. The earlier
// always-visible panel form ate too much horizontal space on mobile
// and clashed with the SearchBar, so we're back to a click-to-expand
// dropdown — but sized to fit content rather than a fixed width.
//
// The food category filter that briefly nested here lives inside
// SimulationToolbar now, so this component is layers-only again.
const FilterDropdown = ({ toggles, buttonLabel = "Layers", heritageMode = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef(null);

    // Close on click outside the pill (only while open — no point
    // listening every render when collapsed).
    useEffect(() => {
        if (!isOpen) return undefined;
        const handler = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen]);

    // Close on Escape (same conditional-bind pattern as above).
    useEffect(() => {
        if (!isOpen) return undefined;
        const handler = (e) => { if (e.key === "Escape") setIsOpen(false); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen]);

    const visibleCount = toggles.filter(t => t.visible).length;

    return (
        <div ref={rootRef} className="relative inline-block">
            <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setIsOpen(o => !o)}
                className={`flex items-center gap-2 px-3 h-10 text-sm shadow-md rounded-xl cursor-pointer transition-colors duration-700 ${
                    heritageMode
                        ? "bg-[#f4ebd8] text-[#3e2723] border border-[#5d4037]/30"
                        : "bg-white"
                }`}
            >
                <span className="font-medium">{buttonLabel}</span>
                <span className={`text-xs tabular-nums ${heritageMode ? "text-[#5d4037]/70" : "text-gray-500"}`}>
                    {visibleCount} / {toggles.length}
                </span>
                <svg
                    className={`w-2.5 h-2.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                    aria-hidden
                >
                    <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m1 1 4 4 4-4"
                    />
                </svg>
            </button>

            {isOpen && (
                <div
                    className={`absolute right-0 mt-1 min-w-52 rounded-xl shadow-md z-50 ${
                        heritageMode
                            ? "bg-[#f4ebd8] text-[#3e2723] border border-[#5d4037]/30"
                            : "bg-white"
                    }`}
                >
                    <ul className="p-2 space-y-0.5">
                        {toggles.map((toggle) => (
                            <li key={toggle.id}>
                                <label
                                    className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                                        heritageMode ? "hover:bg-[#e8dcc4]" : "hover:bg-gray-100"
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={toggle.visible}
                                        onChange={() => toggle.onToggle(v => !v)}
                                    />
                                    <span>{toggle.label}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default FilterDropdown;
