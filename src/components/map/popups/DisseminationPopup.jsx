export function DisseminationPopup({properties}){
  return(
    <div>
      <p>Population:{properties.population}</p>
      <p>Median Income: {properties.medianIncome}</p>
    </div>
  )
}