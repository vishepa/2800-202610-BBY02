import React, { useState } from "react";
import accountIcon from "../../../public/user.png";
import { useScreenWidth } from "./widthHelper";
import { useAuth } from "./authentication/AuthContext.jsx";
import LoginSignupPopup from "../account/LoginSignupPopup.jsx";

export default function TogglePage({ setPage, sidebarOpen }) {
  const width = useScreenWidth();
  const { user } = useAuth() ?? {};
  const [showLogin, setShowLogin] = useState(false);

  if (sidebarOpen && width < 768) return null;

  const handleToggle = () => {
    if (user) {
      setPage("account");
    } else {
      setShowLogin(true);
    }
  };

  return (
    <>
      {showLogin && (
        <LoginSignupPopup onClose={() => setShowLogin(false)} />
      )}
      <button
        onClick={handleToggle}
        className="fixed bottom-20 right-20 z-[9999] w-16 h-16 rounded-full bg-green-400 shadow-md flex items-center justify-center overflow-hidden"
      >
        <img src={accountIcon} alt="Account" className="w-10 h-10 object-contain" />
      </button>
    </>
  );
}