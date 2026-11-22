const MATCH_NOTHING = [
    '==',
    ['literal', 1],
    ['literal', 0]
];

export const transitSelectionLayers = [
    {
        id: 'selected-transit-stop',
        type: 'symbol',
        source: 'transit_stops',
        'source-layer': 'transit_stops',
        minzoom: 13,
        filter:
            MATCH_NOTHING,
        layout: {
            'icon-image':
                'transit-bus-stop',
            'icon-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                14, 0.95,
                16, 1.05,
                18, 1.15,
                20, 1.25
            ],
            /*
             * A selected stop must remain visible regardless
             * of nearby symbols.
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
     * Larger invisible click target.
     */
    {
        id: 'transit-stop-hit-area',
        type: 'circle',
        source: 'transit_stops',
        'source-layer': 'transit_stops',
        minzoom: 13,
        paint: {
            'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                14, 10,
                16, 12,
                18, 14,
                20, 16
            ],
            'circle-color':
                '#000000',
            'circle-opacity':
                0.001
        }
    }
];
