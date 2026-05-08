export function DisseminationPopup({properties}){
  return(
    <div>
      <p>Population Density per km2:{properties.population_density_per_km2}</p>
      <p>Average Household Size: {properties.avg_household_size}</p>
      <p>Median Household Income: {properties.median_household_income}</p>
      <p>Low Income (LIM-AT): {properties.pct_low_income_lim_at}</p>
      <p>Shelter Cost 30%+: {properties.pct_shelter_cost_30pct_plus}</p>
      <p>Commute by Car: {properties.pct_commute_car}</p>
      <p>Commute by Transit: {properties.pct_commute_transit}</p>
      <p>Commute by Walk: {properties.pct_commute_walk}</p>
    </div>
  )
}