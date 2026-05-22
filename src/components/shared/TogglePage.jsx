import React, { useState } from "react";
import accountIcon from "../../../public/user.png";
import { useScreenWidth } from "./useScreenWidth";
import { useAuth } from "./authentication/AuthContext.jsx";
import LoginSignupPopup from "../account/LoginSignupPopup.jsx";

// Two placements share the same auth/popup machinery:
//   - "floating": fixed bottom-right circular button (mobile map view)
//   - "header":   compact inline button anchored to the right end of
//                 the header flex row (desktop layout)
// Each placement opts out at the wrong breakpoint via Tailwind's
// md:hidden / hidden md:flex, so callers can render both in parallel
// (Header + MapPage) without coordinating — CSS picks the visible one.
export default function TogglePage({
  setPage,
  sidebarOpen,
  page,
  placement = "floating",
  heritageMode = false,
}) {
  const width = useScreenWidth();
  const { user } = useAuth() ?? {};
  const [showLogin, setShowLogin] = useState(false);

  // The mobile sidebar covers the floating button's slot when open, so
  // we hide it. The header version isn't on the map so the sidebar
  // doesn't affect it.
  if (placement === "floating" && sidebarOpen && width < 768) return null;

  const handleToggle = () => {
    if (user) {
      setPage(prev => (prev === "account" ? "map" : "account"));
    } else {
      setShowLogin(true);
    }
  };

  const ariaLabel = user
    ? (page === "account" ? "Back to map" : "Open account")
    : "Sign in";

  // Header variant: 48×48 circle, sits at the right end of the header
  // row via ml-auto. Smaller than the floating button so it matches the
  // visual weight of header type. Heritage palette swaps cream/brown
  // chrome to match the rest of the parchment UI.
  if (placement === "header") {
    return (
      <>
        {showLogin && <LoginSignupPopup onClose={() => setShowLogin(false)} />}
        <button
          onClick={handleToggle}
          aria-label={ariaLabel}
          className={`hidden md:flex ml-auto w-12 h-12 rounded-full shadow-sm border items-center justify-center overflow-hidden transition-colors duration-700 ${
            heritageMode
              ? "bg-[#f4ebd8] border-[#5d4037]/30 hover:bg-[#ecdfc4]"
              : "bg-white border-gray-200 hover:bg-gray-50"
          }`}
        >
          <img src={accountIcon} alt="" className="w-7 h-7 object-contain" />
        </button>
      </>
    );
  }

  // Floating variant: original fixed bottom-right circle. md:hidden so it
  // disappears on desktop where the header variant takes over.
  return (
    <>
      {showLogin && <LoginSignupPopup onClose={() => setShowLogin(false)} />}
      <button
        onClick={handleToggle}
        aria-label={ariaLabel}
        className="fixed bottom-6 right-6 z-[10] md:hidden w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden"
      >
        <img src={accountIcon} alt="" className="w-10 h-10 object-contain" />
      </button>
    </>
  );
}
