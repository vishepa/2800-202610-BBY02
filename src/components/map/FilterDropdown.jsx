import { useState, useEffect, useRef } from "react"
import FeaturePopup from "./FeaturePopup"
import Tooltip from "./Tooltip"

const LayerToggleDropdown = ({ toggles, buttonLabel = "Layers" }) => {
  const [isOpen, setIsOpen] = useState(false);
  // const [selected, setSelected] = useState("Filters")
  const rootRef = useRef(null)

  const [showFilterPopup, setShowFilterPopup] = useState(false)
  const [filterPopupSeen, setFilterPopupSeen] = useState(false)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setIsOpen(false) }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])


  const handleToggle = () => {
    const opening = !isOpen
    if (opening && !filterPopupSeen) {
      setShowFilterPopup(true)
      setFilterPopupSeen(true)
    }
    setIsOpen(opening)

  }


  const visibleCount = toggles.filter(t => t.visible).length;
  // const options = ["Filter 1", "Filter 2", "Filter 3","Filter 4","Filter 5 ","Filter 6"]

  return (
    <>
      <div ref={rootRef} className="relative inline-block">
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-2 px-4 h-10 bg-white rounded-bl-xl text-sm cursor-pointer"
        >
          {buttonLabel} ({visibleCount} / {toggles.length})
          <svg
            className={`w-2.5 h-2.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 10 6"
          >
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 min-w-45 bg-white rounded-b-xl rounded-tl-xl z-50">
            <ul className="p-1">
              {toggles.map((toggle) => (
                <li key={toggle.id}>
                  <label
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={toggle.visible}
                      onChange={() => toggle.onToggle(v => !v)}
                    />
                    <span>{toggle.label}</span>
                  </label>
                  {/*<button
                  type="button"
                  onClick={() => { toggle.onClick(); setIsOpen(false) }}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {toggle.label}
                </button>*/}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showFilterPopup && (
        <FeaturePopup title="Map Filters" onClose={() => setShowFilterPopup(false)}>
          <p>Toggle between different data layers to view grocery stores, community gardens, farmers markets, and other food sources on the map.</p>
        </FeaturePopup>
      )}
    </>
  )
}

export default LayerToggleDropdown;