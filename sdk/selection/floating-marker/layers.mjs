import { ANCHOR_DOT_RADIUS, ANCHOR_RING_RADIUS, NO_FILTER } from './constants.mjs';
import { pinScreenPolygon } from './geometry.mjs';
import { ids } from './helpers.mjs';

function emptyCollection() {
    return { type: 'FeatureCollection', features: [] };
}

export function updateShape(map, key, state) {
    if (state.pinRenderer) return;
    if (!state.coordinate) return;
    const source = map.getSource(ids(key).shapeSource);
    if (!source) { return; }
    const origin = map.project(state.coordinate);
    const centreX = origin.x;
        const centreY =
        origin.y -
        state.lift -
        state.bubbleRadius -
        state.tailLength -
        ANCHOR_RING_RADIUS -
        2;
    const screenPoints =
        pinScreenPolygon(
            centreX,
            centreY,
            state.bubbleRadius,
            state.tailLength
        );
    const coordinates = screenPoints.map(([x, y]) => {
        const p = map.unproject([x, y]);
        return [p.lng, p.lat];
    });
    source.setData({
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Polygon',
                coordinates: [coordinates]
            }
        }]
    });
}

export function ensureLayers(map, key, iconImage, iconSize, labelExpression, accentColour) {
    const layerIds = ids(key);
    if (!map.getSource(layerIds.pointSource)) {
        map.addSource(layerIds.pointSource, {
            type: 'geojson',
            data: emptyCollection()
        });
    }
    if (!map.getSource(layerIds.shapeSource)) {
        map.addSource(layerIds.shapeSource, {
            type: 'geojson',
            data: emptyCollection()
        });
    }
    if (!map.getLayer(layerIds.shape)) {
        map.addLayer({
            id: layerIds.shape,
            type: 'fill',
            source: layerIds.shapeSource,
            paint: {
                'fill-color': '#ffffff',
                'fill-opacity': 1
            }
        });
    }
    if (!map.getLayer(layerIds.shapeOutline)) {
        map.addLayer({
            id: layerIds.shapeOutline,
            type: 'line',
            source: layerIds.shapeSource,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#34495e',
                'line-width': 2
            }
        });
    }
        if (!map.getLayer(layerIds.anchorRing)) {
        map.addLayer({
            id: layerIds.anchorRing,
            type: 'circle',
            source: layerIds.pointSource,
            paint: {
                'circle-radius': ANCHOR_RING_RADIUS,
                'circle-color': '#ffffff',
                'circle-stroke-color': '#34495e',
                'circle-stroke-width': 1
            }
        });
    }
        if (!map.getLayer(layerIds.anchor)) {
        map.addLayer({
            id: layerIds.anchor,
            type: 'circle',
            source: layerIds.pointSource,
            paint: {
                'circle-radius': ANCHOR_DOT_RADIUS,
                'circle-color': accentColour
            }
        });
    }
    if (!map.getLayer(layerIds.marker)) {
        map.addLayer({
            id: layerIds.marker,
            type: 'symbol',
            source: layerIds.pointSource,
            layout: {
                'icon-image': iconImage,
                'icon-size': iconSize,
                'icon-anchor': 'center',
                'icon-pitch-alignment': 'viewport',
                'icon-rotation-alignment': 'viewport',
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
                'icon-padding': 0
            },
            paint: {
                'icon-translate': [0, 0],
                'icon-translate-anchor': 'viewport',
                'icon-translate-transition': { duration: 0, delay: 0 }
            }
        });
    }
        if (
        !map.getLayer(
            layerIds.label
        )
    ) {
        map.addLayer({
            id:
                layerIds.label,
            type:
                'symbol',
            source:
                layerIds.pointSource,
            layout: {
                'text-field':
                    labelExpression,
                'text-font': [
                    'Roboto Black'
                ],
                'text-size':
                    12,
                'text-anchor':
                    'top',
                'text-offset':
                    [0, 1.0],
                'text-max-width':
                    14,
                'text-allow-overlap':
                    true,
                'text-ignore-placement':
                    true,
                'text-optional':
                    false
            },
            paint: {
                'text-color':
                    '#ffffff',
                'text-halo-color':
                    '#263747',
                'text-halo-width':
                    2,
                'text-halo-blur':
                    0.2
            }
        });
    }
    map.setLayoutProperty(
        layerIds.marker,
        'icon-image',
        iconImage
    );
    map.setLayoutProperty(
        layerIds.marker,
        'icon-size',
        iconSize
    );
    map.setLayoutProperty(
        layerIds.label,
        'text-field',
        labelExpression
    );
    map.setPaintProperty(
        layerIds.anchor,
        'circle-color',
        accentColour
    );
}

export function restoreHiddenLayers(map, state) {
    for (
        const [layerId, filter]
        of state.hiddenFilters
    ) {
        if (
            !map.getLayer(
                layerId
            )
        ) {
            continue;
        }
        map.setFilter(
            layerId,
            filter === NO_FILTER
                ? null
                : filter
        );
    }
    state.hiddenFilters.clear();
}

export function hideOriginalFeature(map, state, layerIds, matchExpression) {
    restoreHiddenLayers(
        map,
        state
    );
    if (
        !matchExpression
    ) {
        return;
    }
    const style = map.getStyle();
    for (const layerId of layerIds) {
        const layer =
            style.layers?.find(
                item =>
                    item.id ===
                    layerId
            );
        if (
            !layer ||
            !map.getLayer(layerId)
        ) {
            continue;
        }
        const originalFilter =
            layer.filter === undefined
                ? NO_FILTER
                : structuredClone(
                    layer.filter
                );
        state.hiddenFilters.set(
            layerId,
            originalFilter
        );
        const exclusion = [
            '!',
            structuredClone(
                matchExpression
            )
        ];
        const newFilter =
            originalFilter === NO_FILTER
                ? exclusion
                : [
                    'all',
                    structuredClone(
                        originalFilter
                    ),
                    exclusion
                ];
        map.setFilter(
            layerId,
            newFilter
        );
    }
}

