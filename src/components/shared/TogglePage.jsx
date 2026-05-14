import React from "react";
import accountIcon from "../../../public/user.png";
import AccountPage from "../account/account";
import mapIcon from "../../../public/map.png";
import { useScreenWidth } from "./widthHelper";

export default function TogglePage({ page, setPage, sidebarOpen }) {
  const width = useScreenWidth();
  if (sidebarOpen && width < 768) return null;

  return (
    <button
      onClick={() => setPage(page === "map" ? "account" : "map")}
      className="fixed bottom-20 right-20 z-50 w-15 h-15 rounded-full bg-green-400 shadow-md flex items-center justify-center overflow-hidden"
    >
      <img
        src={page === "map" ? accountIcon : mapIcon}
        alt="toggle page"
        className="w-10 h-10 object-contain"
      />
    </button>
  );
}