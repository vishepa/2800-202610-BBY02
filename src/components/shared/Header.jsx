import React from "react";
import { useScreenWidth } from "./widthHelper";


export default function Header({ sidebarOpen, coverageMode, onToggleCoverage }) {
    const width = useScreenWidth();
    if (sidebarOpen && width < 768) return null;
    return (
        <div className="w-full h-25 bg-white shadow-md flex items-center px-6 z-10">
            <h1 className="text-5xl text-gray-700 rounded-xl p-4" style={{ fontFamily: 'Monoton, cursive' }}>Onion</h1>
            <h1 className="hidden sm:flex ml-2 text-3xl font-bold text-gray-700 text-center items-center" style={{ fontFamily: 'Playfair Display, serif' }}>The Map</h1>
            {/* Easter egg trigger, lights up when active so users can find the off switch. */}
            {onToggleCoverage && (
                <button
                    type="button"
                    onClick={onToggleCoverage}
                    aria-pressed={!!coverageMode}
                    aria-label={coverageMode ? "Exit 15-minute city view" : "Show 15-minute city view"}
                    title={coverageMode ? "Exit 15-minute city view" : "🧅 Peel back a layer…"}
                    className={`ml-3 text-2xl leading-none transition-all duration-200 select-none cursor-pointer
                        ${coverageMode
                            ? "opacity-100 scale-110 drop-shadow-[0_0_6px_rgba(34,197,94,0.7)]"
                            : "opacity-30 hover:opacity-90 hover:scale-110"}`}
                >
                    🧅
                </button>
            )}
        </div>
    );
}
