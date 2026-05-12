import { useState } from "react";

function MapSimButton({ active, setActive }) {
  return (
    <div className="fixed top-25 left-1/2 -translate-x-1/2 z-10">
      <div className="relative flex w-40 bg-gray-200 rounded-b-xl p-1 shadow-md">
        
        <div
          className="absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-white rounded-full shadow transition-all duration-300"
          style={{
            left: active === "sim" ? "50%" : "0.25rem",
          }}
        />

        <button
          onClick={() => setActive("map")}
          className={`relative z-10 w-1/2 py-1 ${
            active === "map" ? "text-black" : "text-gray-500"
          }`}
        >
          Map
        </button>

        <button
          onClick={() => setActive("sim")}
          className={`relative z-10 w-1/2 py-1 ${
            active === "sim" ? "text-black" : "text-gray-500"
          }`}
        >
          Sim
        </button>
      </div>
    </div>
  );
}

export default MapSimButton;