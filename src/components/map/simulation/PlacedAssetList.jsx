import { FOOD_CATEGORY_BY_ID } from "../../../constants/foodCategories";

export function PlacedAssetList({ placedAssets, removePlacedAsset }) {
    return (
        <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Placed Assets
            </h3>
            {placedAssets.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                    No assets placed yet — pick an icon and click the map to start.
                </p>
            ) : (
                <ul className="space-y-1">
                    {placedAssets.map(asset => {
                        const category = FOOD_CATEGORY_BY_ID[asset.category];
                        return (
                            <li
                                key={asset.id}
                                className="flex items-center gap-2 p-2 bg-gray-50 rounded-md"
                            >
                                {category && (
                                    <img
                                        src={category.icon}
                                        alt={category.label}
                                        className="w-6 h-6 flex-shrink-0"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-700 truncate">
                                        {category?.label ?? asset.category}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {asset.lat.toFixed(4)}, {asset.lng.toFixed(4)}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removePlacedAsset(asset.id)}
                                    title="Remove"
                                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors text-lg leading-none"
                                >
                                    ×
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
 
export default PlacedAssetList;