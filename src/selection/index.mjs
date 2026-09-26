import {
    clearBuildingHighlight
} from './buildings.mjs';

import {
    clearRoadSelection,
    selectRoad
} from './roads.mjs';

import {
    clearPoiSelection,
    selectPoi
} from './poi.mjs';

import {
    clearSportsSelection,
    selectSportsFacility
} from './sports.mjs';

import {
    clearTransitSelection,
    selectTransitStop
} from './transit.mjs';


export function clearSelection(map) {
    clearBuildingHighlight(map);
    clearRoadSelection(map);
    clearPoiSelection(map);
    clearSportsSelection(map);
    clearTransitSelection(map);
}


export {
    selectPoi,
    selectRoad,
    selectSportsFacility,
    selectTransitStop
};