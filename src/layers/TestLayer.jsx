import { IconLayer } from '@deck.gl/layers';

export function getTestLayer() {
  return new IconLayer({
    id: 'test-icon-layer',

    data: [
      { name: 'Vancouver', position: [-123.129, 49.289] }
    ],

    getPosition: d => d.position,

    // Replace icons to use atlas to improve performance
    getIcon: () => ({
      url: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
      width: 100,
      height: 100,
      anchorY: 128
    }),

    getSize: 40,
    sizeUnits: 'pixels',

    pickable: true,
    onClick: info => console.log('clicked:', info.object)
  });
}