/*
 * POI label hierarchy.
 *
 * Labels intentionally appear later than markers/icons.
 *
 * Lower label_rank means higher semantic priority.
 */


function namedFilter(
    additionalFilter
) {
    const hasName = [
        'all',

        ['has', 'display_name'],

        [
            '!=',
            ['get', 'display_name'],
            ''
        ]
    ];


    if (!additionalFilter) {
        return hasName;
    }


    return [
        'all',

        hasName,

        additionalFilter
    ];
}


function rankFilter(
    maxRank
) {
    return [
        '<=',

        [
            'coalesce',
            ['get', 'label_rank'],
            999
        ],

        maxRank
    ];
}


function createLabelLayer({
    id,
    minzoom,
    maxzoom,
    filter
}) {
    const layer = {
        id,

        type:
            'symbol',

        source:
            'poi_render',

        'source-layer':
            'poi_render',

        minzoom,

        filter:
            namedFilter(filter),

        layout: {
            'text-field':
                ['get', 'display_name'],

            'text-font': [
                'Noto Sans Regular'
            ],

            'text-size': [
                'interpolate',
                ['linear'],
                ['zoom'],

                13, 10,
                16, 11,
                18, 12,
                20, 13
            ],


            /*
             * Put text below the POI marker.
             */
            'text-anchor':
                'top',

            'text-offset': [
                0,
                1.45
            ],

            'text-max-width':
                12,

            'text-padding':
                4,


            /*
             * Lower rank should be considered first.
             */
            'symbol-sort-key': [
                'coalesce',
                ['get', 'label_rank'],
                999
            ],


            /*
             * Labels must respect collisions.
             */
            'text-allow-overlap':
                false,

            'text-ignore-placement':
                false,


            /*
             * The POI icon itself already identifies the
             * location, so the label may disappear if there
             * is not enough room.
             */
            'text-optional':
                true
        },

        paint: {
            'text-color':
                '#d8e4ec',

            'text-halo-color':
                '#2d3445',

            'text-halo-width':
                1.5,

            'text-halo-blur':
                0.5
        }
    };


    if (
        maxzoom !== undefined
    ) {
        layer.maxzoom =
            maxzoom;
    }


    return layer;
}


export const poiLabelLayers = [
    /*
     * z13–15:
     *
     * Only the most important things get names.
     */
    createLabelLayer({
        id:
            'poi-labels-major',

        minzoom:
            13,

        maxzoom:
            15,

        filter:
            rankFilter(25)
    }),


    /*
     * z15–16:
     *
     * Universities, hospitals, major tourism, schools,
     * important health/civic features.
     */
    createLabelLayer({
        id:
            'poi-labels-important',

        minzoom:
            15,

        maxzoom:
            16,

        filter:
            rankFilter(40)
    }),


    /*
     * z16–18:
     *
     * Restaurants, cafés, useful shops/services, etc.
     */
    createLabelLayer({
        id:
            'poi-labels-normal',

        minzoom:
            16,

        maxzoom:
            18,

        filter:
            rankFilter(65)
    }),


    /*
     * z18+:
     *
     * Full street-level labeling, still subject to
     * MapLibre collision detection.
     */
    createLabelLayer({
        id:
            'poi-labels-detail',

        minzoom:
            18,

        filter:
            null
    })
];