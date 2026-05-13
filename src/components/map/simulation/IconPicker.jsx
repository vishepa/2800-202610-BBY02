import { FOOD_CATEGORIES } from "../../../constants/foodCategories";

export function IconPicker({ selectedCategory, setSelectedCategory }) {
    const handleClick = (categoryId) => {
        // Click selected icon again to deselect
        setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
    };

    return (
        <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Place a hypothetical food asset
            </h3>
            <div className="flex flex-wrap gap-2">
                {FOOD_CATEGORIES.map(cat => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleClick(cat.id)}
                            title={cat.label}
                            className={`p-2 rounded-lg border-2 transition-colors ${
                                isSelected
                                    ? 'border-green-300 bg-green-50'
                                    : 'border-gray-200 bg-white hover:border-gray-400'
                            }`}
                        >
                            <img
                                src={cat.icon}
                                alt={cat.label}
                                className="w-11 h-11"
                            />
                        </button>
                    );
                })}
            </div>
            {selectedCategory && (
                <p className="text-xs text-gray-500 mt-2">
                    Click the map to place a {selectedCategory.toLowerCase()}.
                </p>
            )}
        </div>
    );
}

export default IconPicker;