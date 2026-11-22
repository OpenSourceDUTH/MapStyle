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
import { selectFloatingPoint, clearFloatingPoint } from './floating-marker.mjs';
import { sanitizeValue } from './floating-marker/helpers.mjs';
import { getPoiMarkerImage } from '../../src/icons/poi-icons.mjs';

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

const setSelection = (map, ids, feature) => {
    const id = feature?.id ?? feature?.properties?.id ?? feature?.properties?.osm_id;
    for (const layerId of ids) if (map.getLayer(layerId)) map.setFilter(layerId, id == null ? ['==', ['literal', 1], ['literal', 0]] : ['==', ['id'], id]);
    return feature;
};
export function clearSelection(map) {
    clearFloatingPoint(map, 'poi');
    for (const layer of selectionLayers) if (map.getLayer(layer.id)) map.setFilter(layer.id, ['==', ['literal', 1], ['literal', 0]]);
}
export function poiSelectionMatch(feature) {
    const p = feature.properties ?? {};
    const identityKey = ['place_id', 'id', 'osm_id', 'poi_id', 'fid'].find(key => p[key] != null);
    return p.place_id != null
        ? ['==', ['get', 'place_id'], ['literal', sanitizeValue(p.place_id)]]
        : feature.id != null
        ? ['==', ['id'], ['literal', sanitizeValue(feature.id)]]
        : identityKey
            ? ['==', ['get', identityKey], ['literal', sanitizeValue(p[identityKey])]]
            : ['all', ...Object.entries(p)
                .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
                .map(([key, value]) => ['==', ['get', key], ['literal', value]])];
}
export function selectPoi(map, feature) {
    clearSelection(map);
    const p = feature.properties ?? {};
    const hideMatch = poiSelectionMatch(feature);
    const hideLayerIds = map.getStyle().layers
        .filter(layer => layer.source === 'places' && layer.type === 'symbol' && !layer.id.startsWith('selected-'))
        .map(layer => layer.id);
    const icon = getPoiMarkerImage(p);
    selectFloatingPoint(map, {key: 'poi', feature, iconImage: icon, iconSize: 1, labelExpression: ['coalesce',['get','display_name'],['get','name'],['get','name:el'],['get','name:en'],['get','brand'],['get','operator'], ''], accentColour: '#4f91c7', compositeSprite: icon, hideLayerIds, hideMatch});
    return setSelection(map, ['selected-poi-base','selected-poi-inner','selected-poi-anchor','selected-poi-label'], feature);
}
export function selectRoad(map, feature) { clearSelection(map); return setSelection(map, ['selected-road'], feature); }
export function selectSportsFacility(map, feature) { clearSelection(map); return setSelection(map, ['selected-sports-facility','selected-sports-facility-outline'], feature); }
export function selectTransitStop(map, feature) { clearSelection(map); return setSelection(map, ['selected-transit-stop'], feature); }
