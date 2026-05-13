import { useState } from "react";
import MapPage from "./components/map/MapPage";
import AccountPage from "./components/account/Account";

export default function App() {
  const [page, setPage] = useState("map");

  return (
    <div className="relative w-full h-screen">
      { page === "account" ? (
        <AccountPage onBack={() => setPage("map")} page={page} setPage={setPage} />
      ) : (
        <MapPage page={page} setPage={setPage} />
      )}
    </div>
  );
}