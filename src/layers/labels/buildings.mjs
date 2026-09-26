export const buildingLabelLayers = [
    {
        id: 'building-labels',

        type: 'symbol',

        source: 'building_labels',
        'source-layer': 'building_labels',

        minzoom: 15,

        filter: [
            'all',
            ['has', 'display_name'],
            ['!=', ['get', 'display_name'], '']
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

                15, 10,
                16, 11,
                18, 13,
                20, 15
            ],

            'text-anchor': 'center',
            'text-max-width': 12,

            'text-allow-overlap': false,
            'text-ignore-placement': false,

            'text-padding': 3
        },

        paint: {
            'text-color': '#d5e1e8',

            'text-halo-color': '#34475a',
            'text-halo-width': 1.5,
            'text-halo-blur': 0.5
        }
    }
];