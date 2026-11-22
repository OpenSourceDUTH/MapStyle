import {
    BUBBLE_RADIUS_END,
    BUBBLE_RADIUS_START,
    SELECTED_LIFT_PX,
    SELECTED_SCALE,
    TAIL_LENGTH_PX
} from './constants.mjs';

function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

export function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
}

export function selectedPoiAnimationValues(progress) {
    const t = clamp01(progress);

    return {
        progress: t,
        scale: 1 + (SELECTED_SCALE - 1) * t,
        lift: SELECTED_LIFT_PX * t,
        bubbleRadius:
            BUBBLE_RADIUS_START +
            (BUBBLE_RADIUS_END - BUBBLE_RADIUS_START) * t,
        tailLength: TAIL_LENGTH_PX * t
    };
}

export { clamp01 };
