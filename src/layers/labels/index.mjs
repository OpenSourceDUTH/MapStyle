import {
    roadLabelLayers
} from './roads.mjs';

import {
    buildingLabelLayers
} from './buildings.mjs';


export const labelLayers = [
    ...roadLabelLayers,
    ...buildingLabelLayers
];