/*
 * BUILDING GEOMETRY
 *
 * Shared physical model for building height and base elevation.
 *
 * Explicit OSM height takes priority over building levels.
 * Where neither exists, a conservative fallback height is used.
 */

const FLOOR_HEIGHT = 3;
const FALLBACK_HEIGHT = 9;


export const buildingHeight = [
    'case',

    [
        '>',
        [
            'to-number',
            ['get', 'height'],
            0
        ],
        0
    ],

    [
        'to-number',
        ['get', 'height'],
        FALLBACK_HEIGHT
    ],

    [
        '>',
        [
            'to-number',
            ['get', 'levels'],
            0
        ],
        0
    ],

    [
        '*',
        [
            'to-number',
            ['get', 'levels'],
            3
        ],
        FLOOR_HEIGHT
    ],

    FALLBACK_HEIGHT
];


export const buildingBase = [
    'case',

    [
        '>',
        [
            'to-number',
            ['get', 'min_height'],
            0
        ],
        0
    ],

    [
        'to-number',
        ['get', 'min_height'],
        0
    ],

    [
        '>',
        [
            'to-number',
            ['get', 'min_level'],
            0
        ],
        0
    ],

    [
        '*',
        [
            'to-number',
            ['get', 'min_level'],
            0
        ],
        FLOOR_HEIGHT
    ],

    0
];