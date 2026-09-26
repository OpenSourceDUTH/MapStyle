import { colors } from '../../tokens/colors.mjs';

export const parkLayers = [
    {
        id: 'parks',
        type: 'fill',
        source: 'land',
        'source-layer': 'land',
        filter: ['==', ['get', 'leisure'], 'park'],
        paint: {
            'fill-color': colors.park
        }
    },

    {
        id: 'gardens',
        type: 'fill',
        source: 'land',
        'source-layer': 'land',
        filter: ['==', ['get', 'leisure'], 'garden'],
        paint: {
            'fill-color': colors.garden
        }
    }
];