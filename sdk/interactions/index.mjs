import { clearSelection, selectPoi, selectRoad, selectSportsFacility, selectTransitStop } from '../selection/index.mjs';

const INTERACTIVE_LAYERS = [
    {id: 'transit-stop-hit-area', type: 'transit_stop'},
    {id: 'poi-hit-area', type: 'poi'},
    {id: 'sports-hit-area', type: 'sports_facility'},
    {id: 'road-hit-area', type: 'road'}
];

function visiblePoiLayers(map) {
    return (map.getStyle?.().layers ?? []).filter(layer => /^(poi-labels-|poi-markers-|transit-bus-|transit-stop-anchors)/.test(layer.id)).map(layer => layer.id);
}

function activeLayerIds(map) {
    return [...INTERACTIVE_LAYERS.filter(({id}) => map.getLayer(id)).map(({id}) => id), ...visiblePoiLayers(map)];
}

function findTarget(features) {
    const transit = features.find(feature => feature.layer?.id === 'transit-stop-hit-area' || /^(transit-bus-|transit-stop-anchors)/.test(feature.layer?.id ?? ''));
    if (transit) return {type: 'transit_stop', feature: transit};
    const visiblePoi = features.find(feature => /^(poi-labels-|poi-markers-)/.test(feature.layer?.id ?? ''));
    if (visiblePoi) return {type: 'poi', feature: visiblePoi};
    for (const interaction of INTERACTIVE_LAYERS) {
        const feature = features.find(candidate => candidate.layer?.id === interaction.id);
        if (feature) return {type: interaction.type, feature};
    }
    return null;
}

function queryFeatures(map, point) {
    const layers = activeLayerIds(map);
    return layers.length ? map.queryRenderedFeatures(point, {layers}) : [];
}

function selectTarget(map, target) {
    switch (target.type) {
        case 'transit_stop': return selectTransitStop(map, target.feature);
        case 'poi': return selectPoi(map, target.feature);
        case 'sports_facility': return selectSportsFacility(map, target.feature);
        case 'road': return selectRoad(map, target.feature);
        default: return null;
    }
}

export function enableInteractions(map, {onSelect = () => {}, onClear = () => {}} = {}) {
    map.on('click', event => {
        const target = findTarget(queryFeatures(map, event.point));
        if (!target) {
            clearSelection(map);
            onClear();
            return;
        }
        clearSelection(map);
        const selection = selectTarget(map, target);
        if (selection) onSelect(selection);
    });
    map.on('mousemove', event => {
        map.getCanvas().style.cursor = queryFeatures(map, event.point).length ? 'pointer' : '';
    });
}
