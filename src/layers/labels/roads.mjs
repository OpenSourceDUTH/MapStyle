export const roadLabelLayers = [
    {
        id: 'road-labels',

        type: 'symbol',

        source: 'named_roads',
        'source-layer': 'named_roads',

        minzoom: 13,

        layout: {
            'symbol-placement': 'line',

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

                13, 9,
                14, 10,
                16, 11,
                18, 13,
                20, 15
            ],

            /*
             * Repeat long street names periodically.
             */
            'symbol-spacing': 300,

            'text-max-angle': 35,
            'text-padding': 6,

            'text-rotation-alignment': 'map',
            'text-pitch-alignment': 'viewport',

            'text-allow-overlap': false,
            'text-ignore-placement': false
        },

        paint: {
            'text-color': '#b8c9d5',

            'text-halo-color': '#2d3445',
            'text-halo-width': 1.5,
            'text-halo-blur': 0.5
        }
    }
];