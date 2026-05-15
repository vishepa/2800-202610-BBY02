export default function TransitInfoPanel({ properties }) {
    const routes = properties.routes ?? [];

    return (
        <div className="text-sm">
            <h3 className="font-semibold text-base mb-3">{properties.name}</h3>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-gray-600">
                <span>Stop ID</span>
                <span className="text-right">{properties.stop_id}</span>
                <span>Routes</span>
                <span className="text-right">{routes.length}</span>
            </div>

            <div className="mt-3">
                <h4 className="font-medium text-gray-700 mb-1">Routes serving this stop</h4>
                {routes.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {routes.map(route => (
                            <span
                                key={route}
                                className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium"
                            >
                                {route}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-xs italic">No route data for this stop</p>
                )}
            </div>
        </div>
    );
}
