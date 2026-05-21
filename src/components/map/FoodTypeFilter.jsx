import { FOOD_CATEGORIES } from "../../constants/foodCategories";

// Rendered as a sub-section inside FilterDropdown — that ancestor
// provides the white card / heritage chrome, so this component is
// chrome-less and only paints the header + checkbox list.
export default function FoodTypeFilter({ activeCategories, onChange }) {
    // null = every category active; otherwise it's an explicit array.
    const isActive = (id) => activeCategories === null || activeCategories.includes(id);

    const toggle = (id) => {
        if (activeCategories === null) {
            // First toggle from "all" — uncheck this one.
            onChange(FOOD_CATEGORIES.filter(c => c.id !== id).map(c => c.id));
        } else if (activeCategories.includes(id)) {
            onChange(activeCategories.filter(t => t !== id));
        } else {
            const next = [...activeCategories, id];
            // Collapse back to the "all" sentinel when everything's re-checked.
            onChange(next.length === FOOD_CATEGORIES.length ? null : next);
        }
    };

    const activeCount = activeCategories === null
        ? FOOD_CATEGORIES.length
        : activeCategories.length;

    return (
        <div className="px-4 pt-2 pb-3">
            <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-semibold">Food Categories</span>
                <span className="text-xs text-gray-500">
                    {activeCount} / {FOOD_CATEGORIES.length}
                </span>
            </div>
            {/* Capped at 40vh so even with ~28 categories the panel stays
                within the viewport; pr-1 leaves room for the scrollbar
                so checkbox labels don't shift when it appears. */}
            <div className="max-h-[40vh] overflow-y-auto pr-1 space-y-0.5">
                {FOOD_CATEGORIES.map(cat => (
                    <label
                        key={cat.id}
                        className="flex items-center gap-2 px-2 py-1 text-sm rounded-md hover:bg-gray-100 cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            checked={isActive(cat.id)}
                            onChange={() => toggle(cat.id)}
                        />
                        <span>{cat.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
