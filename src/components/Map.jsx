import MapSimButton from "./MapSimButton";

export function Map({ active, setActive }) {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="w-full h-16 bg-white shadow-md flex items-center px-6 z-10">
        <h1 className="text-xl font-bold text-gray-700">JohnMap</h1>
      </div>

      <MapSimButton active={active} setActive={setActive} />

      <div className="flex-1 bg-gray-300 flex items-center justify-center">
        <span className="text-gray-500">Map goes here</span>
      </div>
    </div>
  );
}
export default Map;
