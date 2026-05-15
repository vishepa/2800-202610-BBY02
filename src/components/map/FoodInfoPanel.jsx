export default function FoodInfoPanel({ properties }) {
    const tags = properties.tags ?? [];

    return (
        <div className="text-sm">
            <h3 className="font-semibold text-base mb-3">{properties.name}</h3>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-gray-600">
                <span>Type</span>
                <span className="text-right">{properties.category}</span>
                <span>Address</span>
                <span className="text-right">{properties.address}</span>
            </div>

            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                    {tags.map(tag => (
                        <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}