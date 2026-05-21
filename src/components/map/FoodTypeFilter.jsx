import { FOOD_CATEGORIES } from "../../constants/foodCategories";

export default function FoodTypeFilter({ activeCategories, onChange }) {

    // null = all selected; otherwiste it's an explicit array
    // const isActive = (id) => activeCategories === null || activeCategories.includes(id);
    const isActive = (id) => activeCategories === null || activeCategories === undefined || activeCategories?.includes(id);

    const toggle = (id) => {
        if (activeCategories === null) {
            // first toggle from "all" - uncheck this one
            onChange(FOOD_CATEGORIES.filter(c => c.id !== id).map(c => c.id));
        } else if (activeCategories.includes(id)) {
            onChange(activeCategories.filter(t => t !== id));
        } else {
            const next = [...activeCategories, id];
            // if everything is selected, collapse back to "all selected" state (null)
            onChange(next.length === FOOD_CATEGORIES.length ? null : next);
        }
    };

    // Group categories by icon
    const groupedByIcon = FOOD_CATEGORIES.reduce((acc, cat) => {
    const key = cat.icon;
    if (!acc[key]) acc[key] = [];
    acc[key].push(cat);
    return acc;
    }, {});

    return (
        <div className="space-y-2">
        {Object.entries(groupedByIcon).map(([icon, cats]) => (
            <div key={icon} className="flex items-center px-3 py-2 rounded-lg border-1 border-gray-300 gap-2">
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
