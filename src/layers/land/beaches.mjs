import { colors } from '../../tokens/colors.mjs';

export const beachLayers = [
    {
        id: 'beaches',
        type: 'fill',
        source: 'land',
        'source-layer': 'land',

        filter: [
            'any',
            ['==', ['get', 'natural'], 'beach'],
            ['==', ['get', 'natural'], 'sand']
        ],

        paint: {
            'fill-color': colors.beach
        }
    }
];