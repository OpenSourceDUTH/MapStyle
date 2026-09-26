import { colors } from '../../tokens/colors.mjs';


const physicalWidth = (z20) => [
    'interpolate',
    ['exponential', 2],
    ['zoom'],

    14, z20 / 64,
    15, z20 / 32,
    16, z20 / 16,
    17, z20 / 8,
    18, z20 / 4,
    19, z20 / 2,
    20, z20,
    21, z20 * 2,
    22, z20 * 4
];


const trackWidth = physicalWidth(16);


export const trackLayers = [
    {
        id: 'roads-track',

        type: 'line',

        source: 'transportation',
        'source-layer': 'transportation',

        minzoom: 13,

        filter: [
            '==',
            ['get', 'highway'],
            'track'
        ],

        layout: {
            'line-cap': 'round',
            'line-join': 'round'
        },

        paint: {
            'line-color': colors.track,
            'line-width': trackWidth,

            'line-dasharray': [
                3,
                2
            ]
        }
    }
];