import {
    colors
} from '../../tokens/colors.mjs';

import {
    buildingHeight,
    buildingBase
} from './geometry.mjs';


export const buildingExtrusionLayers = [
    {
        id: 'buildings-3d',

        type: 'fill-extrusion',

        source: 'buildings',
        'source-layer': 'buildings',

        minzoom: 15,

        paint: {
            'fill-extrusion-color':
                colors.building,

            'fill-extrusion-height':
                buildingHeight,

            'fill-extrusion-base':
                buildingBase,

            'fill-extrusion-opacity':
                0.96,

            'fill-extrusion-vertical-gradient':
                true
        }
    }
];