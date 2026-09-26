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


/*
 * Depth of the entire crossing along the road.
 *
 * This controls how "thick" the crosswalk area is,
 * NOT the number of zebra stripes.
 */
const crossingDepth = physicalWidth(28);


export const crossingLayers = [
    {
        id: 'crossings',

        type: 'line',

        source: 'crossing_markings',
        'source-layer': 'crossing_markings',

        minzoom: 16,

        layout: {
            'line-cap': 'butt',
            'line-join': 'miter'
        },

        paint: {
            'line-color': colors.crossing,
            'line-opacity': 0.95,

            /*
             * Overall depth of the crosswalk.
             */
            'line-width': crossingDepth,

            /*
             * Shorter dash + shorter gap = more zebra stripes
             * across the road.
             *
             * Previously:
             * [1.4, 0.8]
             *
             * That made each individual bar far too long.
             */
            'line-dasharray': [
                0.35,
                0.35
            ]
        }
    }
];