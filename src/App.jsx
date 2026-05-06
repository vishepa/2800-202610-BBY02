import { useState } from "react";
import Map from "./components/Map";
import SimulationToolbar from "./components/SimulationToolbar";
import { FilterSpecification } from "maplibre-gl";
import FilterDropdown from "./components/FilterDropdown";

{/* this is the app JSX, it will contain the main application structure */ }
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative w-full h-screen">


      {/* Map fills the 'whole' page */}
      <div className={`absolute inset-0 transition-all duration-300 ${sidebarOpen ? "pl-75" : "pl-0"}`}>
        <Map />
      </div>


      {/* SimulationToolbar slides in/out */}
      <div className={`absolute top-0 left-0 h-full w-75 z-10 bg-white shadow-lg transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
        <SimulationToolbar />
      </div>


      <div className="fixed right-0 top-16 flex items-center px-6 z-10 cursor-pointer bg-white shadow-md rounded-bl-lg h-10">
        <FilterDropdown />
      </div>

      {/* Toggle button sticks to the edge of the sidebar */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`absolute top-1/2 z-20 bg-white shadow-md rounded-r-lg px-1 py-3 transition-all duration-300 ${sidebarOpen ? `left-75` : "left-0"
          }`}
      >
        {sidebarOpen ? "<" : ">"}
      </button>

    </div>
  );
}