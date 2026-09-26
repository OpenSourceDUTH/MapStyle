/*
 * POI visibility policy.
 *
 * Lower label_rank = more important.
 *
 * Semantic filtering controls which POIs are eligible.
 * Symbol collision controls local density.
 */


export const majorPoiFilter = [
    '==',
    ['get', 'importance'],
    'major'
];


export function poiRankFilter(
    maxRank
) {
    return [
        'all',

        [
            '!=',
            ['get', 'importance'],
            'minor'
        ],

        [
            '<=',
            [
                'coalesce',
                ['get', 'label_rank'],
                999
            ],
            maxRank
        ]
    ];
}


export const nonMinorPoiFilter = [
    '!=',
    ['get', 'importance'],
    'minor'
];


export const poiVisibilityBands = [
    /*
     * City overview.
     */
    {
        id: 'major',

        minzoom: 13,
        maxzoom: 14,

        filter:
            majorPoiFilter
    },


    /*
     * Important city POIs.
     */
    {
        id: 'important',

        minzoom: 14,
        maxzoom: 15,

        filter: [
            'any',

            majorPoiFilter,

            poiRankFilter(40)
        ]
    },


    /*
     * Everyday useful POIs begin appearing.
     */
    {
        id: 'normal',

        minzoom: 15,
        maxzoom: 16,

        filter: [
            'any',

            majorPoiFilter,

            poiRankFilter(65)
        ]
    },


    /*
     * All meaningful non-minor POIs.
     */
    {
        id: 'non-minor',

        minzoom: 16,
        maxzoom: 18,

        filter:
            nonMinorPoiFilter
    },


    /*
     * Detailed map.
     *
     * Everything becomes eligible.
     */
    {
        id: 'detail',

        minzoom: 18,
        maxzoom: 20,

        filter:
            null
    },


    /*
     * Building/street-level view.
     *
     * Everything remains eligible.
     *
     * We keep this as a separate band so we can later make
     * z20+ rendering behave differently without affecting
     * lower zooms.
     */
    {
        id: 'street',

        minzoom: 20,

        filter:
            null
    }
];