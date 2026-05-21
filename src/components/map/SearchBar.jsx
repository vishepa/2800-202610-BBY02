import { useState, useEffect, useRef, useCallback } from "react";

// ─── Data fetching ────────────────────────────────────────────────────────────

/**
 * Fetches food assets from the API and returns a flat array of asset objects.
 * The route returns a GeoJSON FeatureCollection; we unwrap it here so the
 * rest of the component doesn't have to think about GeoJSON internals.
 *
 * Each returned object has: { id, name, category, address, lng, lat }
 * (lng/lat extracted from the Point geometry so callers can flyTo directly)
 */
export async function fetchFoodAssets(search = "") {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const res = await fetch(`/api/food-assets?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const geojson = await res.json(); // { type: "FeatureCollection", features: [...] }
  const features = geojson?.features ?? [];

  return features.map((f) => ({
    ...f.properties,                       // id, name, category, address
    lng: f.geometry?.coordinates?.[0],     // GeoJSON is [lng, lat]
    lat: f.geometry?.coordinates?.[1],
  }));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useFoodAssetSearch(onSelect) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback((value) => {
    clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchFoodAssets(value);
        setResults(data.slice(0, 8)); // cap dropdown to 8
        setOpen(true);
      } catch (e) {
        setError("Couldn't load results.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    search(v);
  };

  const handleSelect = (asset) => {
    setQuery(asset.name);
    setOpen(false);
    onSelect?.(asset);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
    onSelect?.(null);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  return { query, results, loading, error, open, setOpen, handleChange, handleSelect, handleClear };
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * SearchBar
 *
 * Props:
 *   onSelect(asset | null) — called when the user picks a result or clears.
 *                            asset has at least { id, name, address, lat, lng }.
 *                            Fly-to / highlight logic belongs in the parent/map layer.
 *   placeholder            — input placeholder text
 *   className              — extra classes on the wrapper
 */
export default function SearchBar({
  onSelect,
  placeholder = "Search by name or address…",
  className = "",
}) {
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const {
    query, results, loading, error,
    open, setOpen,
    handleChange, handleSelect, handleClear,
  } = useFoodAssetSearch(onSelect);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setOpen]);

  // Keyboard nav
  const [activeIdx, setActiveIdx] = useState(-1);
  useEffect(() => { setActiveIdx(-1); }, [results]);

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(results[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`w-full max-w-sm ${className}`}
    >
      {/* Input row */}
      <div className="flex items-center gap-2 rounded-lg bg-white/90 backdrop-blur border border-zinc-200 shadow-md px-3 py-2 focus-within:border-zinc-400 transition-colors">
        {/* Search icon */}
        <SearchIcon className="shrink-0 text-zinc-400 w-4 h-4" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder}
          aria-label="Search food assets"
          aria-autocomplete="list"
          aria-expanded={open}
          className="flex-1 bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 outline-none min-w-0"
        />

        {/* Spinner / clear */}
        {loading && <Spinner />}
        {!loading && query && (
          <button
            onClick={handleClear}
            aria-label="Clear search"
            className="shrink-0 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <ul
          role="listbox"
          className="absolute z-4 mt-1.5 w-full rounded-lg bg-white border border-zinc-200 shadow-lg overflow-hidden text-sm"
        >
          {error && (
            <li className="px-4 py-3 text-red-500 text-xs">{error}</li>
          )}

          {!error && results.length === 0 && (
            <li className="px-4 py-3 text-zinc-400 text-xs">No results found.</li>
          )}

          {results.map((asset, idx) => (
            <li
              key={asset.id}
              role="option"
              aria-selected={idx === activeIdx}
              onMouseDown={() => handleSelect(asset)}
              onMouseEnter={() => setActiveIdx(idx)}
              className={`flex flex-col gap-0.5 px-4 py-2.5 cursor-pointer transition-colors
                ${idx === activeIdx ? "bg-zinc-100" : "hover:bg-zinc-50"}
                ${idx !== 0 ? "border-t border-zinc-100" : ""}
              `}
            >
              <span className="font-medium text-zinc-800 truncate">{asset.name}</span>
              {asset.address && (
                <span className="text-xs text-zinc-400 truncate">{asset.address}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Icons (inline SVG, no extra deps) ───────────────────────────────────────

function SearchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="6.5" cy="6.5" r="4.5" />
      <path d="M11 11l3 3" strokeLinecap="round" />
    </svg>
  );
}

function XIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M1 1l10 10M11 1L1 11" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 shrink-0 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}