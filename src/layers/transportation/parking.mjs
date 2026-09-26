import { colors } from '../../tokens/colors.mjs';


const parkingAreaFilter = [
    '==',
    ['get', 'amenity'],
    'parking'
];


export const parkingLayers = [

    /*
     * Parking surface.
     *
     * Semi-transparent blue tint so the underlying land
     * remains visible.
     */
    {
        id: 'transport-parking',

        type: 'fill',

        source: 'transportation_areas',
        'source-layer': 'transportation_areas',

        minzoom: 12,

        filter: parkingAreaFilter,

        paint: {
            'fill-color': '#4f7fa3',
            'fill-opacity': 0.28
        }
    },


    /*
     * Dashed parking boundary.
     */
    {
        id: 'transport-parking-outline',

        type: 'line',

        source: 'transportation_areas',
        'source-layer': 'transportation_areas',

        minzoom: 14,

        filter: parkingAreaFilter,

        layout: {
            'line-cap': 'butt',
            'line-join': 'round'
        },

        paint: {
            'line-color': '#6fa7d1',
            'line-opacity': 0.9,

            'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                14, 0.7,
                16, 1,
                18, 1.5,
                20, 2
            ],

            'line-dasharray': [
                3,
                2
            ]
        }
    }

];