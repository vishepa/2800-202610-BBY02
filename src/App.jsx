import { useState } from "react";
import MapPage from "./components/map/MapPage";
import AccountPage from "./components/account/account";
import Header from "./components/shared/Header.jsx";

export default function App() {
  const [page, setPage] = useState("map");

  return (
    <div className="flex flex-col w-full h-screen">
      <Header sidebarOpen={useState(false)} />
      <div className="flex-1 relative overflow-hidden">
        { page === "account" ? (
          <AccountPage onBack={() => setPage("map")} page={page} setPage={setPage} />
        ) : (
          <MapPage page={page} setPage={setPage} />
        )}
      </div>
    </div>
  );
}