// Always-visible layer toggle panel pinned to the top-right of the map.
// The collapsible-button incarnation was retired so the toggles never
// hide what the user just changed.
//
// Filename kept as FilterDropdown for now to avoid churn in callers;
// rename is fair game in a follow-up.
const FilterDropdown = ({ toggles, heritageMode = false }) => {
  const visibleCount = toggles.filter((t) => t.visible).length;

  return (
    <div
      className={`rounded-bl-xl shadow-md w-64 transition-colors duration-700 ${
        heritageMode
          ? "bg-[#f4ebd8] text-[#3e2723] border-l border-b border-[#5d4037]/30"
          : "bg-white"
      }`}
    >
      <div className="px-4 pt-3 pb-3">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm font-semibold">Layers</span>
          <span
            className={`text-xs ${
              heritageMode ? "text-[#5d4037]/70" : "text-gray-500"
            }`}
          >
            {visibleCount} / {toggles.length}
          </span>
        </div>
        <ul className="space-y-0.5">
          {toggles.map((toggle) => (
            <li key={toggle.id}>
              <label
                className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                  heritageMode ? "hover:bg-[#e8dcc4]" : "hover:bg-gray-100"
                }`}
              >
                <input
                  type="checkbox"
                  checked={toggle.visible}
                  onChange={() => toggle.onToggle((v) => !v)}
                />
                <span>{toggle.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FilterDropdown;
