import {
    colors
} from '../../tokens/colors.mjs';


export const buildingFootprintLayers = [
    {
        id: 'buildings-fill',

        type: 'fill',

        source: 'buildings',
        'source-layer': 'buildings',

        minzoom: 13,

        paint: {
            'fill-color': colors.building,
            'fill-opacity': 1
        }
    },

    {
        id: 'buildings-outline',

        type: 'line',

        source: 'buildings',
        'source-layer': 'buildings',

        minzoom: 14,

        layout: {
            'line-join': 'round'
        },

        paint: {
            'line-color':
                colors.buildingOutline,

            'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],

                14, 0.4,
                17, 0.8,
                20, 1.5
            ]
        }
    }
];