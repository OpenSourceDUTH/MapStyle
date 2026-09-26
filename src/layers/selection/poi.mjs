import {
    poiMarkerImageExpression
} from '../../icons/poi-icons.mjs';


const MATCH_NOTHING = [
    '==',
    ['literal', 1],
    ['literal', 0]
];


/*
 * Base size of the selected POI before runtime animation.
 *
 * Runtime animation multiplies this expression, preserving
 * the existing zoom-dependent marker sizing.
 */
export const selectedPoiBaseSize = [
    'interpolate',
    ['linear'],
    ['zoom'],

    13, 0.95,
    14, 1.00,
    16, 1.15,
    18, 1.30,
    20, 1.45
];


export const poiSelectionLayers = [
    {
        id:
            'selected-poi-marker',

        type:
            'symbol',

        source:
            'poi_render',

        'source-layer':
            'poi_render',

        minzoom:
            13,

        filter:
            MATCH_NOTHING,

        layout: {
            'icon-image':
                poiMarkerImageExpression,

            'icon-size':
                selectedPoiBaseSize,

            /*
             * Runtime animation modifies this.
             *
             * Negative Y moves the marker upward.
             */
            'icon-offset':
                [0, 0],

            /*
             * Selection must always be visible.
             */
            'icon-allow-overlap':
                true,

            'icon-ignore-placement':
                true
        },

        paint: {
            'icon-halo-color':
                '#d8e4ec',

            'icon-halo-width':
                2,

            'icon-halo-blur':
                0.5
        }
    },


    /*
     * Invisible interaction target.
     */
    {
        id:
            'poi-hit-area',

        type:
            'circle',

        source:
            'poi_render',

        'source-layer':
            'poi_render',

        minzoom:
            13,

        paint: {
            'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],

                13, 11,
                16, 14,
                18, 16,
                20, 18
            ],

            'circle-color':
                '#000000',

            'circle-opacity':
                0
        }
    }
];