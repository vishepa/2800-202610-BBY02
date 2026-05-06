import { useState } from "react";
import Map from "./components/Map";
import SimulationToolbar from "./components/SimulationToolbar";
import { FilterSpecification } from "maplibre-gl";
import FilterDropdown from "./components/FilterDropdown";

{/* this is the app JSX, it will contain the main application structure */ }
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("map"); 

  return (
    <div className="relative w-full h-screen">

      {/* Map */}
      <div className={`absolute inset-0 transition-all duration-300 ${sidebarOpen ? "pl-75" : "pl-0"}`}>
        <Map active={active} setActive={setActive} />
      </div>

      {/* Sidebar */}
      <div className={`absolute top-0 left-0 h-full w-75 z-10 bg-white shadow-lg transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SimulationToolbar active={active} /> 
      </div>

      {/* Toggle sidebar */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`absolute top-1/2 z-20 bg-white shadow-md rounded-r-lg px-1 py-3 transition-all duration-300 ${sidebarOpen ? `left-75` : "left-0"}`}
      >
        {sidebarOpen ? "<" : ">"}
      </button>
    </div>
  );
}