import React, { useRef, useState } from "react";
import { useScreenWidth } from "./widthHelper";
import TogglePage from "./TogglePage.jsx";

// Konami window: clicks more than this many ms apart restart the count.
const CLICK_WINDOW_MS = 1200;
const CLICKS_TO_TRIGGER = 5;

export default function Header({  sidebarOpen, page, setPage, onSecretToggle, heritageMode }) {
    const width = useScreenWidth();
    const clickCount = useRef(0);
    const lastClickAt = useRef(0);
    // Tiny "wiggle" cue once the user is partway through the sequence
    // (3 of 5) so the discovery loop feels rewarding rather than silent.
    const [wiggle, setWiggle] = useState(false);

    const handleLogoClick = () => {
        if (!onSecretToggle) return;
        const now = Date.now();
        if (now - lastClickAt.current > CLICK_WINDOW_MS) {
            clickCount.current = 0;
        }
        lastClickAt.current = now;
        clickCount.current += 1;

        if (clickCount.current >= 3 && clickCount.current < CLICKS_TO_TRIGGER) {
            setWiggle(true);
            setTimeout(() => setWiggle(false), 200);
        }

        if (clickCount.current >= CLICKS_TO_TRIGGER) {
            clickCount.current = 0;
            onSecretToggle();
        }
    };

    if (sidebarOpen && width < 768) return null;

    // Heatmap Heritage palette: warm parchment bar with sepia type, smooth
    // transition so the chrome morphs in sync with the map's CSS filter.
    const headerBgClass = heritageMode
        ? "bg-[#f4ebd8] border-b border-[#5d4037]/30"
        : "bg-white";
    const titleColor = heritageMode ? "text-[#3e2723]" : "text-gray-700";

    return (
        <div className={`w-full h-25 shadow-md flex items-center px-6 z-10 transition-colors duration-700 ${headerBgClass}`}>
            <h1
                onClick={handleLogoClick}
                aria-label={heritageMode ? "Onion logo — click 5× to exit Heritage view" : "Onion logo"}
                className={`text-5xl rounded-xl p-4 cursor-pointer select-none transition-all duration-200 ${
                    wiggle ? "rotate-2 scale-105" : ""
                } ${titleColor}`}
                style={{ fontFamily: 'Monoton, cursive' }}
            >
                Onion
            </h1>
            <h1
                className={`hidden sm:flex ml-2 text-3xl font-bold text-center items-center transition-colors duration-700 ${titleColor}`}
                style={{ fontFamily: 'Playfair Display, serif' }}
            >
                The Map
            </h1>
            <TogglePage page={page} setPage={setPage} sidebarOpen={sidebarOpen} />
        </div>
    );
}
