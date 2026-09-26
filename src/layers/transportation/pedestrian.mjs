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


const genericFootwayWidth = physicalWidth(18);
const pathWidth = physicalWidth(10);
const cyclewayWidth = physicalWidth(16);
const stepsWidth = physicalWidth(14);


const pedestrianAreaFilter = [
    'in',
    ['get', 'highway'],
    ['literal', [
        'pedestrian',
        'footway'
    ]]
];


const genericFootwayFilter = [
    'all',

    [
        '==',
        ['get', 'highway'],
        'footway'
    ],

    [
        '!=',
        ['get', 'footway'],
        'crossing'
    ]
];


export const pedestrianLayers = [

    /*
     * Mapped pedestrian polygons.
     */

    {
        id: 'transport-pedestrian-areas',

        type: 'fill',

        source: 'transportation_areas',
        'source-layer': 'transportation_areas',

        minzoom: 13,

        filter: pedestrianAreaFilter,

        paint: {
            'fill-color': colors.sidewalk,
            'fill-opacity': 1
        }
    },


    /*
     * Independent footways.
     */

    {
        id: 'footways',

        type: 'line',

        source: 'transportation',
        'source-layer': 'transportation',

        minzoom: 15,

        filter: genericFootwayFilter,

        layout: {
            'line-cap': 'round',
            'line-join': 'round'
        },

        paint: {
            'line-color': colors.pedestrian,
            'line-width': genericFootwayWidth
        }
    },


    /*
     * Paths.
     */

    {
        id: 'paths',

        type: 'line',

        source: 'transportation',
        'source-layer': 'transportation',

        minzoom: 14,

        filter: [
            '==',
            ['get', 'highway'],
            'path'
        ],

        layout: {
            'line-cap': 'round',
            'line-join': 'round'
        },

        paint: {
            'line-color': colors.pedestrian,
            'line-width': pathWidth
        }
    },


    /*
     * Cycleways.
     */

    {
        id: 'cycleways',

        type: 'line',

        source: 'transportation',
        'source-layer': 'transportation',

        minzoom: 14,

        filter: [
            '==',
            ['get', 'highway'],
            'cycleway'
        ],

        layout: {
            'line-cap': 'round',
            'line-join': 'round'
        },

        paint: {
            'line-color': colors.pedestrian,
            'line-width': cyclewayWidth
        }
    },


    /*
     * Steps.
     */

    {
        id: 'steps',

        type: 'line',

        source: 'transportation',
        'source-layer': 'transportation',

        minzoom: 15,

        filter: [
            '==',
            ['get', 'highway'],
            'steps'
        ],

        layout: {
            'line-cap': 'butt',
            'line-join': 'round'
        },

        paint: {
            'line-color': colors.pedestrian,
            'line-width': stepsWidth,

            'line-dasharray': [
                1,
                1
            ]
        }
    }
];