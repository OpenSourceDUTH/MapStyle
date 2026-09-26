import { parkingLayers } from './parking.mjs';
import { sidewalkLayers } from './sidewalks.mjs';
import { pedestrianLayers } from './pedestrian.mjs';
import { roadLayers } from './roads.mjs';
import { crossingLayers } from './crossings.mjs';
import { trackLayers } from './tracks.mjs';
import { railwayLayers } from './railways.mjs';


/*
 * Transportation layer ordering matters.
 *
 * Bottom
 *   parking
 *   sidewalks
 *   pedestrian infrastructure
 *   roads
 *   crossings
 *   tracks
 *   railways
 * Top
 */

export const transportationLayers = [
    ...parkingLayers,
    ...sidewalkLayers,
    ...pedestrianLayers,
    ...roadLayers,
    ...crossingLayers,
    ...trackLayers,
    ...railwayLayers
];