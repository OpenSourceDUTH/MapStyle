import {
    buildingSelectionLayers
} from './buildings.mjs';

import {
    roadSelectionLayers
} from './roads.mjs';

import {
    poiSelectionLayers
} from './poi.mjs';

import {
    sportsSelectionLayers
} from './sports.mjs';

import {
    transitSelectionLayers
} from './transit.mjs';


/*
 * Selections that make sense independently of the
 * underlying cartographic representation.
 *
 * These remain available in satellite mode.
 */
export const semanticSelectionLayers = [
    ...poiSelectionLayers,
    ...transitSelectionLayers
];


/*
 * Selections tied to rendered vector geometry.
 *
 * These only make sense when that geometry is actually
 * present in the representation.
 */
export const physicalSelectionLayers = [
    ...buildingSelectionLayers,
    ...roadSelectionLayers,
    ...sportsSelectionLayers
];


/*
 * Complete selection set used by vector representations.
 */
export const selectionLayers = [
    ...physicalSelectionLayers,
    ...semanticSelectionLayers
];