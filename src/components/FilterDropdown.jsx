import { useState, useEffect, useRef } from "react"

const FilterDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState("Filters")
  const rootRef = useRef(null)

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

  const options = ["Filter 1", "Filter 2", "Filter 3","Filter 4","Filter 5 ","Filter 6"]

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-4 h-10 bg-white rounded-bl-xl text-sm cursor-pointer"
      >
        {selected}
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
        <div className="absolute top-[calc(100%-0px)] right-0 min-w-[180px] bg-white rounded-b-xl rounded-tl-xl overflow-hidden z-50">
          <ul className="p-1">
            {options.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => { setSelected(opt); setIsOpen(false) }}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default FilterDropdown;