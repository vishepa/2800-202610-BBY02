export function DisseminationPopup({ properties }) {
    return (
        <div className="max-w-xs text-sm">
            <h3 className="font-semibold text-base mb-2">
                Area {properties.dauid}
            </h3>

            <div className="mb-2">
                <h4 className="font-medium text-gray-700 mb-1">Key Stats</h4>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-600">
                    <span>Density</span>
                    <span className="text-right">{Number(properties.population_density_per_km2).toLocaleString()}/km²</span>
                    <span>Median Income</span>
                    <span className="text-right">${Number(properties.median_household_income).toLocaleString()}</span>
                    <span>Low Income</span>
                    <span className="text-right">{properties.pct_low_income_lim_at}%</span>
                    <span>Shelter 30%+</span>
                    <span className="text-right">{properties.pct_shelter_cost_30pct_plus}%</span>
                    <span>Household Size</span>
                    <span className="text-right">{properties.avg_household_size}</span>
                </div>
            </div>

            <div className="mb-2">
                <h4 className="font-medium text-gray-700 mb-1">Commute</h4>
                <div className="flex gap-2 text-gray-600">
                    <span>Car {properties.pct_commute_car}%</span>
                    <span>Transit {properties.pct_commute_transit}%</span>
                    <span>Walk {properties.pct_commute_walk}%</span>
                </div>
            </div>
        </div>
    );
}
