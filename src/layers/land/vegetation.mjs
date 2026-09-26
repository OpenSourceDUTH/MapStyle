import { colors } from '../../tokens/colors.mjs';

export const vegetationLayers = [
    {
        id: 'vegetation-wood',
        type: 'fill',
        source: 'land',
        'source-layer': 'land',

        filter: [
            'any',
            ['==', ['get', 'natural'], 'wood'],
            ['==', ['get', 'landuse'], 'forest']
        ],

        paint: {
            'fill-color': colors.forest
        }
    },

    {
        id: 'vegetation-grass',
        type: 'fill',
        source: 'land',
        'source-layer': 'land',

        filter: [
            'any',
            ['==', ['get', 'natural'], 'grassland'],
            ['==', ['get', 'landuse'], 'grass']
        ],

        paint: {
            'fill-color': colors.grass
        }
    },

    {
        id: 'vegetation-scrub',
        type: 'fill',
        source: 'land',
        'source-layer': 'land',
        filter: ['==', ['get', 'natural'], 'scrub'],

        paint: {
            'fill-color': colors.scrub
        }
    }
];