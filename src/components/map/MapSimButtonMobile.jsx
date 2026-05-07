function MapSimButtonMobile({ active, setActive }) {
    return (
        <div className="p-4 w-full">
            <button
                onClick={() => setActive("map")}
                className={`w-full py-2 px-4 rounded mb-2 ${active === "map" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                    }`}>
                --------- MAP VIEW ---------
            </button>
            <button
                onClick={() => setActive("sim")}
                className={`w-full py-2 px-4 rounded ${active === "sim" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                    }`}>
                ----- SIMULATOR VIEW -----
            </button>
        </div>
    );
}

export default MapSimButtonMobile;