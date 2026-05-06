import { FOOD_CATEGORIES } from "../constants/foodCategories";

export default function FoodTypeFilter({ activeTypes, onChange }) {

    // null = all selected; otherwiste it's an explicit array
    const isActive = (id) => activeTypes === null || activeTypes.includes(id);

    const toggle = (id) => {
        if (activeTypes === null) {
            // first toggle from "all" - uncheck this one
            onChange(FOOD_CATEGORIES.filter(c => c.id !== id).map(c => c.id)).map(c => c.id);
        } else if (activeTypes.includes(id)) {
            onChange(activeTypes.filter(t => t !== id));
        } else {
            const next = [...activeTypes, id];
            // if everything is selected, collapse back to "all selected" state (null)
            onChange(next.length === FOOD_CATEGORIES.length ? null : next);
        }
    };

    return (
        <div className="bg-white shadow-md rounded p-4 space-y-2">
            {FOOD_CATEGORIES.map(cat => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isActive(cat.id)}
                        onChange={() => toggle(cat.id)}
                    />
                    <span>{cat.label}</span>
                </label>
            ))}
        </div>
    );
}
