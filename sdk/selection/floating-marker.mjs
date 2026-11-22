import { BUBBLE_RADIUS_START } from './floating-marker/constants.mjs';

import { selectedPoiAnimationValues } from './floating-marker/animation.mjs';

import {
    createPinRenderer
} from './floating-marker/renderer.mjs';

import {
    ensureLayers,
    hideOriginalFeature,
    restoreHiddenLayers,
    updateShape
} from './floating-marker/layers.mjs';

import { animate, applyState } from './floating-marker/lifecycle.mjs';

import {
    ids,
    pointCoordinate,
    safeStyleValue,
    sanitizeValue
} from './floating-marker/helpers.mjs';

export { selectedPoiAnimationValues };
export { safeStyleValue } from './floating-marker/helpers.mjs';
const states = new WeakMap();

function emptyCollection() {
    return {
        type: 'FeatureCollection',
        features: []
    };
}

function stateFor( map, key ) {
    let mapState = states.get(map);
    if (!mapState) {
        mapState = new Map();
        states.set( map, mapState);
    }
    if (!mapState.has(key)) {
        mapState.set(key, {
            animationFrame: null,
            coordinate: null,
            baseIconSize: 1,
            lift: 0,
            bubbleRadius: BUBBLE_RADIUS_START,
            tailLength: 0,
            progress: 0,
            pinRenderer: null,
            hiddenFilters: new Map(),
            moveHandler: null
        });
    }
    return mapState.get(key);
}

export function selectFloatingPoint(
    map,
    {
        key,
        feature,
        iconImage,
        iconSize,
        labelExpression,
        accentColour,
        compositeSprite = null,
        hideLayerIds = [],
        hideMatch = null
    }
) {
    const coordinate = pointCoordinate(feature);
    if (!coordinate) {
        return false;
    }
    const state = stateFor(map, key);
    state.pinRenderer = null;
    if (compositeSprite) {
        const sprite = map.getImage(compositeSprite);
        if (sprite) {
            state.pinRenderer = createPinRenderer(sprite, iconSize);
            const image = state.pinRenderer.render(selectedPoiAnimationValues(0));
            if (map.hasImage(ids(key).image)) {
                map.updateImage(ids(key).image, image);
            } else {
                map.addImage(ids(key).image, image, {pixelRatio: 2});
            }
        }
    }
    ensureLayers(
        map,
        key,
        state.pinRenderer ? ids(key).image : iconImage,
        state.pinRenderer ? 1 : iconSize,
        labelExpression,
        accentColour
    );
    if (state.pinRenderer) {
        map.setLayoutProperty(
            ids(key).shape,
            'visibility',
            'none'
        );
        map.setLayoutProperty(
            ids(key).shapeOutline,
            'visibility',
            'none'
        );
    }
    hideOriginalFeature(
        map,
        state,
        hideLayerIds,
        hideMatch
    );
    const layerIds = ids(key);
    const source = map.getSource(layerIds.pointSource);
    const id = sanitizeValue(feature.id);
    source.setData({
        type:
            'FeatureCollection',
        features: [
            {
                type:
                    'Feature',
                ...(
                    id !== null
                        ? { id }
                        : {}
                ),
                properties:
                    sanitizeValue(
                        feature.properties ??
                        {}
                    ),
                geometry: {
                    type:
                        'Point',
                    coordinates:
                        coordinate
                }
            }
        ]
    });
    state.coordinate = coordinate;
    state.baseIconSize = iconSize;
    state.lift = 0;
    state.bubbleRadius = BUBBLE_RADIUS_START;
    state.tailLength = 0;
    state.progress = 0;
    /*
     * Rebuild the screen-space pin when the camera moves.
     */
    if (!state.moveHandler) {
        state.moveHandler = () => {
            if (state.coordinate) {
                updateShape(map, key, state);
            }
        };
        map.on('move', state.moveHandler);
    }
    applyState(map, key, state, 0);
    animate(map, key, state);
    return true;
}

export function clearFloatingPoint(map, key) {
    const state = stateFor(map, key);
    if (state.animationFrame !== null) {
        cancelAnimationFrame(state.animationFrame);
        state.animationFrame = null;
    }
    restoreHiddenLayers( map, state );
    state.coordinate = null
    state.progress = 0;
    state.pinRenderer = null;
    const layerIds = ids(key);
    const pointSource = map.getSource(layerIds.pointSource);
    if (pointSource) {
        pointSource.setData(emptyCollection());
    }
    const shapeSource = map.getSource(layerIds.shapeSource);
    if (shapeSource) {
        shapeSource.setData(emptyCollection());
    }
}
