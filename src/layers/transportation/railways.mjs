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


const railwayWidth = physicalWidth(10);


export const railwayLayers = [
    {
        id: 'railways',

        type: 'line',

        source: 'transportation',
        'source-layer': 'transportation',

        minzoom: 12,

        filter: [
            'has',
            'railway'
        ],

        layout: {
            'line-cap': 'round',
            'line-join': 'round'
        },

        paint: {
            'line-color': colors.railway,
            'line-width': railwayWidth
        }
    }
];