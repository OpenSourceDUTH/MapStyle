/*
 * Bus stop labels.
 *
 * A stop can exist without a name, so labels are explicitly
 * restricted to named stops.
 */

export const transitLabelLayers = [
    {
        id: 'transit-bus-stop-labels',

        type: 'symbol',

        source: 'transit_stops',
        'source-layer': 'transit_stops',

        minzoom: 17,

        filter: [
            'all',

            ['has', 'display_name'],

            [
                '!=',
                ['get', 'display_name'],
                ''
            ]
        ],

        layout: {
            'text-field': [
                'get',
                'display_name'
            ],

            'text-font': [
                'Noto Sans Regular'
            ],

            'text-size': [
                'interpolate',
                ['linear'],
                ['zoom'],

                17, 10,
                19, 11,
                21, 12
            ],

            'text-anchor': 'top',

            'text-offset': [
                0,
                1.5
            ],

            'text-max-width': 14,

            'text-padding': 3,

            'text-allow-overlap': false,
            'text-ignore-placement': false
        },

        paint: {
            'text-color': '#d8e4ec',

            'text-halo-color': '#2d3445',
            'text-halo-width': 1.5,
            'text-halo-blur': 0.5
        }
    }
];