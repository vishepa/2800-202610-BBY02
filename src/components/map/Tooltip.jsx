export default function Tooltip({ text, children, position = "right" }) {
  const positionClasses = position === "left"
    ? "right-full top-1/2 -translate-y-1/2 mr-2"
    : "left-full top-1/2 -translate-y-1/2 ml-2";

  return (
    <span className="relative group inline-flex items-center gap-1">
      {children}
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold cursor-help select-none">?</span>
      <span className={`absolute ${positionClasses} px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-normal w-48 z-[100]`}>
        {text}
      </span>
    </span>
  );
}
