import {
    highlightBuilding
} from './buildings.mjs';

import {
    selectedPoiBaseSize
} from '../layers/selection/poi.mjs';


const MATCH_NOTHING = [
    '==',
    ['literal', 1],
    ['literal', 0]
];


const ANIMATION_DURATION = 280;

/*
 * Final selected marker is substantially larger than
 * the normal selected-marker base size.
 */
const SELECTED_SCALE = 1.45;

/*
 * icon-offset is measured relative to the icon size.
 *
 * -0.65 produces a clearly visible upward "lift".
 */
const SELECTED_LIFT = 0.65;


let animationFrame = null;


function easeOutBack(t) {
    /*
     * Slight overshoot gives the marker a small pop as it
     * rises, then settles into its final position.
     */
    const c1 = 1.70158;
    const c3 = c1 + 1;

    return (
        1 +
        c3 * Math.pow(t - 1, 3) +
        c1 * Math.pow(t - 1, 2)
    );
}


function stopPoiAnimation() {
    if (animationFrame === null) {
        return;
    }

    cancelAnimationFrame(
        animationFrame
    );

    animationFrame = null;
}


function setPoiAnimationState(
    map,
    progress
) {
    if (
        !map.getLayer(
            'selected-poi-marker'
        )
    ) {
        return;
    }


    const scale =
        1 +
        (
            SELECTED_SCALE - 1
        ) *
        progress;


    const lift =
        SELECTED_LIFT *
        progress;


    map.setLayoutProperty(
        'selected-poi-marker',

        'icon-size',

        [
            '*',
            selectedPoiBaseSize,
            scale
        ]
    );


    map.setLayoutProperty(
        'selected-poi-marker',

        'icon-offset',

        [
            0,
            -lift
        ]
    );


    /*
     * Make the halo appear with the selection as well.
     */
    map.setPaintProperty(
        'selected-poi-marker',

        'icon-halo-width',

        2 * progress
    );


    map.setPaintProperty(
        'selected-poi-marker',

        'icon-halo-blur',

        0.5 * progress
    );
}


function animatePoiSelection(
    map
) {
    stopPoiAnimation();


    const start =
        performance.now();


    function frame(now) {
        if (
            !map.getLayer(
                'selected-poi-marker'
            )
        ) {
            animationFrame = null;

            return;
        }


        const elapsed =
            now - start;


        const time =
            Math.min(
                elapsed /
                    ANIMATION_DURATION,
                1
            );


        const progress =
            easeOutBack(time);


        setPoiAnimationState(
            map,
            progress
        );


        if (time < 1) {
            animationFrame =
                requestAnimationFrame(
                    frame
                );

            return;
        }


        /*
         * Set the exact final state after the overshoot
         * animation finishes.
         */
        setPoiAnimationState(
            map,
            1
        );


        animationFrame = null;
    }


    animationFrame =
        requestAnimationFrame(
            frame
        );
}


export function clearPoiSelection(
    map
) {
    stopPoiAnimation();


    if (
        !map.getLayer(
            'selected-poi-marker'
        )
    ) {
        return;
    }


    map.setFilter(
        'selected-poi-marker',
        MATCH_NOTHING
    );


    setPoiAnimationState(
        map,
        0
    );
}


export function selectPoi(
    map,
    feature
) {
    const poiId =
        feature.properties?.poi_id;

    const buildingId =
        feature.properties?.building_id;


    if (
        poiId === undefined ||
        poiId === null
    ) {
        return null;
    }


    if (
        !map.getLayer(
            'selected-poi-marker'
        )
    ) {
        return null;
    }


    /*
     * Reset before exposing the newly selected POI.
     */
    setPoiAnimationState(
        map,
        0
    );


    map.setFilter(
        'selected-poi-marker',

        [
            '==',
            ['get', 'poi_id'],
            poiId
        ]
    );


    animatePoiSelection(
        map
    );


    /*
     * Building highlighting only exists in representations
     * containing building geometry.
     */
    if (
        buildingId !== undefined &&
        buildingId !== null &&
        (
            map.getLayer(
                'selected-building'
            ) ||
            map.getLayer(
                'selected-building-3d'
            )
        )
    ) {
        highlightBuilding(
            map,
            buildingId
        );
    }


    return {
        type:
            'poi',

        id:
            poiId,

        buildingId:
            buildingId ?? null,

        properties:
            feature.properties,

        feature
    };
}