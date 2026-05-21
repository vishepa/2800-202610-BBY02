import { FOOD_CATEGORIES } from "../../constants/foodCategories";

// Rendered inside SimulationToolbar (map-mode sidebar). The toolbar
// supplies the surrounding white/heritage chrome, so this component
// just paints the icon-grouped checkbox list.
export default function FoodTypeFilter({ activeCategories, onChange }) {
    // null/undefined = every category active; otherwise an explicit array.
    // The `== null` check below in `toggle` mirrors this so a missing
    // prop fails as "all-on" instead of crashing on .includes().
    const isActive = (id) =>
        activeCategories === null ||
        activeCategories === undefined ||
        activeCategories?.includes(id);

    const toggle = (id) => {
        // Treat undefined the same as null ("all selected"). Mirrors
        // isActive's guard so a caller that forgets to pass the prop
        // degrades gracefully on the first click instead of throwing
        // on .includes(undefined).
        if (activeCategories == null) {
            // First toggle from "all" — uncheck this one.
            onChange?.(FOOD_CATEGORIES.filter(c => c.id !== id).map(c => c.id));
        } else if (activeCategories.includes(id)) {
            onChange?.(activeCategories.filter(t => t !== id));
        } else {
            const next = [...activeCategories, id];
            // Collapse back to the "all selected" sentinel (null) when
            // everything's re-checked.
            onChange?.(next.length === FOOD_CATEGORIES.length ? null : next);
        }
    };

    // Categories sharing an icon are grouped under one row, since several
    // closely-related types reuse the same pin art (e.g. all the youth/
    // young-adult meal categories). One header + nested checkbox list
    // per icon keeps the panel scannable.
    const groupedByIcon = FOOD_CATEGORIES.reduce((acc, cat) => {
        const key = cat.icon;
        if (!acc[key]) acc[key] = [];
        acc[key].push(cat);
        return acc;
    }, {});

    return (
        <div className="space-y-2">
            {Object.entries(groupedByIcon).map(([icon, cats]) => (
                <div
                    key={icon}
                    className="flex items-center px-3 py-2 rounded-lg border-1 border-gray-300 gap-2"
                >
                    <img src={icon} alt="" className="w-7 h-7 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        {cats.map(cat => (
                            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isActive(cat.id)}
                                    onChange={() => toggle(cat.id)}
                                />
                                <span className="text-sm">{cat.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
