const MATCH_NOTHING = [
    '==',
    ['literal', 1],
    ['literal', 0]
];


/*
 * Only these sports-related areas are interactive.
 *
 * leisure=track is intentionally NOT included.
 * Tracks are cartographic features only.
 */
const SPORTS_FILTER = [
    'in',
    ['get', 'leisure'],
    [
        'literal',
        [
            'pitch',
            'playground'
        ]
    ]
];


export const sportsSelectionLayers = [
    {
        id: 'sports-hit-area',
        type: 'fill',

        source: 'land',
        'source-layer': 'land',

        filter: SPORTS_FILTER,

        paint: {
            'fill-color': '#000000',
            'fill-opacity': 0
        }
    },

    {
        id: 'selected-sports-facility',
        type: 'fill',

        source: 'land',
        'source-layer': 'land',

        filter: MATCH_NOTHING,

        paint: {
            'fill-color': '#4da3ff',
            'fill-opacity': 0.38
        }
    },

    {
        id: 'selected-sports-facility-outline',
        type: 'line',

        source: 'land',
        'source-layer': 'land',

        filter: MATCH_NOTHING,

        paint: {
            'line-color': '#76b9ff',

            'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],

                14, 1.5,
                17, 2.5,
                20, 4
            ],

            'line-opacity': 1
        }
    }
];