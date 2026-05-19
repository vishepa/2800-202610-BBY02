import { useState } from "react";
import { saveSimulation } from "../../../lib/simulations.js";

// Modal for naming and persisting the current simulation (the set of
// placed assets). Rendered from SimulationToolbar only when a user is
// logged in.
export default function SaveSimulationModal({ placedAssets, onClose, onSaved }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) return setError("Please enter a name.");
    setLoading(true);
    setError("");
    try {
      const saved = await saveSimulation({
        name: name.trim(),
        description: description.trim(),
        placedAssets,
      });
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save simulation.");
      setLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-sm mx-4 bg-white rounded-[20px] border border-neutral-200 shadow-xl p-8">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 text-xl leading-none transition-colors"
          aria-label="Close"
        >
          ×
        </button>

        <p className="font-serif text-[22px] text-neutral-900 mb-0.5 tracking-tight">
          Save simulation
        </p>
        <p className="text-[13px] text-neutral-400 mb-6">
          {placedAssets.length} placed asset{placedAssets.length === 1 ? "" : "s"} will be saved
        </p>

        <div className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Downtown grocery scenario"
              autoFocus
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-400"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this scenario explore?"
              rows={3}
              className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-400"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="mt-5 w-full py-2.5 bg-neutral-900 text-white text-[14px] font-medium rounded-xl hover:bg-neutral-700 active:scale-[0.98] disabled:bg-neutral-300 disabled:cursor-not-allowed transition-all duration-150"
        >
          {loading ? "Saving…" : "Save simulation"}
        </button>

        {error && (
          <p className="mt-3 text-[12.5px] text-[#993c1d] bg-[#faece7] rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
