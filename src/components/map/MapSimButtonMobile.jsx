function MapSimButtonMobile({ active, setActive }) {
    return (
        <div className="flex gap-2 p-4 w-full">
            <button
                onClick={() => setActive("map")}
                className={`flex-1 aspect-square rounded-xl text-sm font-bold ${active === "map" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}
                style={{fontFamily: "playfair display"}}>
                
                MAP VIEW
            </button>
            <button
                onClick={() => setActive("sim")}
                className={`flex-1 aspect-square rounded-xl text-sm font-bold ${active === "sim" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}
                style={{fontFamily: "playfair display"}}>
                SIMULATOR VIEW
            </button>
        </div>
    );
}

export default MapSimButtonMobile;