import {
    poiMarkerLayers
} from './markers.mjs';

import {
    poiIconLayers
} from './icons.mjs';

import {
    poiLabelLayers
} from './labels.mjs';


export const poiLayers = [
    ...poiMarkerLayers,
    ...poiIconLayers
];


export {
    poiLabelLayers
};