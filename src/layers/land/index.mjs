import { colors } from '../../tokens/colors.mjs';
import { sportsLayers } from './sports.mjs';

/*
 * LAND
 *
 * General land-cover rendering belongs here.
 *
 * More specialized land features, such as sports facilities,
 * are implemented in their own modules and composed into
 * landLayers below.
 */

const baseLandLayers = [
    /*
     * Residential
     */
    {
        id: 'land-residential',
        type: 'fill',
        source: 'land',
        'source-layer': 'land',

        filter: [
            '==',
            ['get', 'landuse'],
            'residential'
        ],

        paint: {
            'fill-color': colors.residential
        }
    },

    /*
     * Commercial
     */
    {
        id: 'land-commercial',
        type: 'fill',
        source: 'land',
        'source-layer': 'land',

        filter: [
            '==',
            ['get', 'landuse'],
            'commercial'
        ],

        paint: {
            'fill-color': colors.commercial
        }
    },

    /*
     * Retail
     */
    {
        id: 'land-retail',
        type: 'fill',
        source: 'land',
        'source-layer': 'land',

        filter: [
            '==',
            ['get', 'landuse'],
            'retail'
        ],

        paint: {
            'fill-color': colors.retail
        }
    },

    /*
     * Industrial
     */
    {
        id: 'land-industrial',
        type: 'fill',
        source: 'land',
        'source-layer': 'land',

        filter: [
            '==',
            ['get', 'landuse'],
            'industrial'
        ],

        paint: {
            'fill-color': colors.industrial
        }
    },

    /*
     * Forest / woodland
     */
    {
        id: 'land-forest',
        type: 'fill',
        source: 'land',
        'source-layer': 'land',

        filter: [
            'any',

            [
                '==',
                ['get', 'natural'],
                'wood'
            ],

            [
                '==',
                ['get', 'landuse'],
                'forest'
            ]
        ],

        paint: {
            'fill-color': colors.forest
        }
    },

    /*
     * Scrub
     */
    {
        id: 'land-scrub',
        type: 'fill',
        source: 'land',
        'source-layer': 'land',

        filter: [
            '==',
            ['get', 'natural'],
            'scrub'
        ],

        paint: {
            'fill-color': colors.scrub
        }
    },

    /*
     * Grass / meadow
     */
    {
        id: 'land-grass',
        type: 'fill',
        source: 'land',
        'source-layer': 'land',

        filter: [
            'any',

            [
                '==',
                ['get', 'natural'],
                'grassland'
            ],

            [
                'in',
                ['get', 'landuse'],
                [
                    'literal',
                    [
                        'grass',
                        'meadow',
                        'recreation_ground'
                    ]
                ]
            ]
        ],

        paint: {
            'fill-color': colors.grass
        }
    },

    /*
     * Parks
     */
    {
        id: 'land-parks',
        type: 'fill',
        source: 'land',
        'source-layer': 'land',

        filter: [
            'in',
            ['get', 'leisure'],
            [
                'literal',
                [
                    'park',
                    'nature_reserve'
                ]
            ]
        ],

        paint: {
            'fill-color': colors.park
        }
    },

    /*
     * Gardens
     */
    {
        id: 'land-gardens',
        type: 'fill',
        source: 'land',
        'source-layer': 'land',

        filter: [
            '==',
            ['get', 'leisure'],
            'garden'
        ],

        paint: {
            'fill-color': colors.garden
        }
    },

    /*
     * Beaches
     */
    {
        id: 'land-beaches',
        type: 'fill',
        source: 'land',
        'source-layer': 'land',

        filter: [
            '==',
            ['get', 'natural'],
            'beach'
        ],

        paint: {
            'fill-color': colors.beach
        }
    },

    /*
     * Sand
     */
    {
        id: 'land-sand',
        type: 'fill',
        source: 'land',
        'source-layer': 'land',

        filter: [
            '==',
            ['get', 'natural'],
            'sand'
        ],

        paint: {
            'fill-color': colors.sand
        }
    }
];


const waterLayers = [
    /*
     * Water polygons
     */
    {
        id: 'water',
        type: 'fill',
        source: 'water',
        'source-layer': 'water',

        paint: {
            'fill-color': colors.water
        }
    },

    /*
     * Waterways
     */
    {
        id: 'waterways',
        type: 'line',
        source: 'waterways',
        'source-layer': 'waterways',

        layout: {
            'line-cap': 'round',
            'line-join': 'round'
        },

        paint: {
            'line-color': colors.waterway,

            'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 0.5,
                15, 1.2,
                18, 2.5
            ]
        }
    }
];


export const landLayers = [
    ...baseLandLayers,

    /*
     * Sports rendering is owned by sports.mjs:
     *
     * - athletics tracks
     * - pitches
     * - playgrounds
     * - bleachers
     */
    ...sportsLayers,

    ...waterLayers
];