import { ANIMATION_DURATION } from './constants.mjs';
import { selectedPoiAnimationValues, easeOutCubic } from './animation.mjs';
import { ids, scaledIconSize } from './helpers.mjs';
import { updateShape } from './layers.mjs';

export function applyState(map, key, state, progress) {
    const layerIds = ids(key);
    const animation = selectedPoiAnimationValues(progress);
    state.lift = animation.lift;
    state.bubbleRadius = animation.bubbleRadius;
    state.tailLength = animation.tailLength;
    state.progress = animation.progress;
    if (state.pinRenderer) {
        map.setLayoutProperty(
            layerIds.marker,
            'icon-size',
            1
        );
        map.setLayoutProperty(
            layerIds.marker,
            'icon-anchor',
            'bottom'
        );
        map.setPaintProperty(
            layerIds.marker,
            'icon-translate',
            [
                0,
                /*
                 * Keep the bottom tip anchored just above the real
                 * location dot while the bubble grows.  The translation
                 * tracks the complete lower geometry (radius + drip), so
                 * animation changes do not make the tip drift.
                 */
                -1
            ]
        );
        map.updateImage(
            layerIds.image,
            state.pinRenderer.render(animation)
        );
        map.triggerRepaint();
        return;
    }
    map.setLayoutProperty(
        layerIds.marker,
        'icon-size',
        scaledIconSize(
            state.baseIconSize,
            animation.scale
        )
    );
    map.setPaintProperty(
        layerIds.marker,
        'icon-translate',
        [
            0,
            -animation.lift
        ]
    );
    /*
     * DO NOT translate the label.
     *
     * It belongs below the origin dot, not beside the
     * floating selected marker.
     */
    updateShape(
        map,
        key,
        state
    );
}

export function animate(map, key, state) {
    if (
        state.animationFrame !==
        null
    ) {
        cancelAnimationFrame(
            state.animationFrame
        );
    }
    const start = performance.now();
    function frame(now) {
        const time =
            Math.min(
                (
                    now - start
                ) /
                ANIMATION_DURATION,
                1
            );
        applyState(
            map,
            key,
            state,
            easeOutCubic(time)
        );
        if (time < 1) {
            state.animationFrame =
                requestAnimationFrame(
                    frame
                );
            return;
        }
        applyState(
            map,
            key,
            state,
            1
        );
        state.animationFrame = null;
    }
    state.animationFrame =
        requestAnimationFrame(
            frame
        );
}

