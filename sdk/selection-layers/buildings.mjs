import {
    buildingHeight,
    buildingBase
} from '../../src/layers/buildings/index.mjs';

const MATCH_NOTHING = [
    '==',
    ['literal', 1],
    ['literal', 0]
];

export const buildingSelectionLayers = [
    {
        id: 'selected-building-fill',
        type: 'fill',
        source: 'buildings',
        'source-layer': 'buildings',
        filter: MATCH_NOTHING,
        paint: {
            'fill-color': '#4da3ff',
            'fill-opacity': 0.28
        }
    },

    {
        id: 'selected-building-outline',
        type: 'line',
        source: 'buildings',
        'source-layer': 'buildings',
        filter: MATCH_NOTHING,
        paint: {
            'line-color': '#76b9ff',
            'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                14, 1.5,
                18, 3
            ],
            'line-opacity': 0.95
        }
    },

    {
        id: 'selected-building-3d',
        type: 'fill-extrusion',
        source: 'buildings',
        'source-layer': 'buildings',
        minzoom: 15,
        filter: MATCH_NOTHING,
        paint: {
            'fill-extrusion-color': '#4da3ff',
            'fill-extrusion-height':
                buildingHeight,
            'fill-extrusion-base':
                buildingBase,
            'fill-extrusion-opacity': 0.65
        }
    }
];
