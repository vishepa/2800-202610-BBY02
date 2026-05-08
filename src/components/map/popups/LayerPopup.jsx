import { Popup } from 'react-map-gl/maplibre';
import { DisseminationPopup } from './DisseminationPopup';

// Popup lookup table
const MAP_POPUP = {
  'dissemination-areas': DisseminationPopup,
};

// selected: the object saved in state when a user clicks a layer
// It contains {object, coordinate, layerId}
export function LayerPopup({selected, onClose}){
  if(! selected) return null;

  const PopupContent = MAP_POPUP[selected.layerId];

  if(!PopupContent) return null;

  return (
    <Popup
      longitude={selected.coordinate[0]}
      latitude={selected.coordinate[1]}
      onClose={onClose}
      anchor='bottom'
    >
      <PopupContent properties={selected.object.properties}/>
    </Popup>
  );
}

