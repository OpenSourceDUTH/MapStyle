export const sportsLayers = [
    /*
     * RUNNING / ATHLETICS TRACK SURFACE
     */
    {
        id: 'sports-track-base',

        type: 'fill',

        source: 'land',
        'source-layer': 'land',

        filter: [
            '==',
            ['get', 'leisure'],
            'track'
        ],

        paint: {
            'fill-color': '#b86f5d',
            'fill-opacity': 0.95
        }
    },


    /*
     * TRACK OUTER BOUNDARY
     */
    {
        id: 'sports-track-outline',

        type: 'line',

        source: 'land',
        'source-layer': 'land',

        filter: [
            '==',
            ['get', 'leisure'],
            'track'
        ],

        paint: {
            'line-color': '#7d493f',

            'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],

                14, 0.8,
                17, 1.3,
                20, 2
            ]
        }
    },


    /*
     * RUNNING LANES
     *
     * These remain derived geometry, but are intentionally
     * subtle so they don't dominate the map.
     */
    {
        id: 'sports-running-lanes',

        type: 'line',

        source: 'running_track_lanes',
        'source-layer': 'running_track_lanes',

        minzoom: 17,

        layout: {
            'line-cap': 'round',
            'line-join': 'round'
        },

        paint: {
            'line-color': '#ead7cf',

            'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],

                17, 0.25,
                19, 0.55,
                21, 0.9
            ],

            'line-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],

                17, 0.35,
                19, 0.65,
                21, 0.85
            ]
        }
    },


    /*
     * SPORTS PITCHES
     */
    {
        id: 'sports-pitch-base',

        type: 'fill',

        source: 'land',
        'source-layer': 'land',

        filter: [
            '==',
            ['get', 'leisure'],
            'pitch'
        ],

        paint: {
            'fill-color': [
                'match',
                ['get', 'surface'],

                'grass',
                '#3f755f',

                'sand',
                '#9b8968',

                'asphalt',
                '#536978',

                'acrylic',
                '#536978',

                '#46745f'
            ],

            'fill-opacity': 0.92
        }
    },

    {
        id: 'sports-pitch-outline',

        type: 'line',

        source: 'land',
        'source-layer': 'land',

        filter: [
            '==',
            ['get', 'leisure'],
            'pitch'
        ],

        paint: {
            'line-color': '#83a795',

            'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],

                14, 0.8,
                17, 1.5,
                19, 2
            ],

            'line-opacity': 0.9
        }
    },


    /*
     * PLAYGROUNDS
     */
    {
        id: 'playground-base',

        type: 'fill',

        source: 'land',
        'source-layer': 'land',

        filter: [
            '==',
            ['get', 'leisure'],
            'playground'
        ],

        paint: {
            'fill-color': '#dfc98f',
            'fill-opacity': 0.9
        }
    },

    {
        id: 'playground-outline',

        type: 'line',

        source: 'land',
        'source-layer': 'land',

        filter: [
            '==',
            ['get', 'leisure'],
            'playground'
        ],

        paint: {
            'line-color': '#b49f6c',
            'line-width': 1
        }
    },


    /*
     * BLEACHERS
     *
     * Keep these simple for now.
     *
     * We deliberately do not generate synthetic seat rows
     * because their direction depends heavily on the source
     * polygon geometry and can look incorrect.
     */
    {
        id: 'sports-bleachers-shadow',

        type: 'fill',

        source: 'land',
        'source-layer': 'land',

        minzoom: 15,

        filter: [
            '==',
            ['get', 'leisure'],
            'bleachers'
        ],

        paint: {
            'fill-color': '#263744',
            'fill-opacity': 0.7,

            'fill-translate': [
                1.2,
                1.2
            ],

            'fill-translate-anchor': 'map'
        }
    },

    {
        id: 'sports-bleachers-base',

        type: 'fill',

        source: 'land',
        'source-layer': 'land',

        minzoom: 15,

        filter: [
            '==',
            ['get', 'leisure'],
            'bleachers'
        ],

        paint: {
            'fill-color': '#718895',
            'fill-opacity': 1
        }
    },

    {
        id: 'sports-bleachers-outline',

        type: 'line',

        source: 'land',
        'source-layer': 'land',

        minzoom: 15,

        filter: [
            '==',
            ['get', 'leisure'],
            'bleachers'
        ],

        paint: {
            'line-color': '#c6d3da',

            'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],

                15, 0.7,
                17, 1,
                20, 1.6
            ],

            'line-opacity': 0.9
        }
    }
];