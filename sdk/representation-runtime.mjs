import {
    getRepresentation
} from '../src/representations/index.mjs';

import {
    createStyle
} from '../src/style.mjs';

let activeRepresentation = null;

/*
 * Return the ID of the currently active representation.
 */
export function getActiveRepresentation() {
    return activeRepresentation;
}

/*
 * Change the active map representation.
 *
 * Representations now define complete style compositions.
 *
 * This means switching representation replaces the MapLibre
 * style rather than toggling visibility on a collection of
 * permanently loaded layers.
 *
 * This keeps the architecture clean:
 *
 * 2d
 *     vector sources + physical geometry + semantic overlays
 *
 * 3d-buildings
 *     vector sources + extruded buildings + semantic overlays
 *
 * satellite
 *     regional imagery + semantic overlays
 *
 * aerial
 *     local aerial imagery + semantic overlays
 *
 * photorealistic-3d
 *     regional satellite + 3D Tiles mesh + POI overlays
 *
 * Sources that are irrelevant to the active representation
 * are therefore not loaded at all.
 */
export function setRepresentation(
    map,
    representationId
) {
    const representation =
        getRepresentation(
            representationId
        );
    /*
     * If this representation is already active, there is
     * nothing to rebuild.
     *
     * This is particularly important during initial map load:
     * dev.mjs creates the map with createStyle() and then
     * registers the initial representation here.
     */
    if (
        activeRepresentation ===
        representation.id
    ) {
        return representation;
    }
    /*
     * Determine whether the map already contains the style
     * corresponding to the requested representation.
     *
     * During initial startup the Map constructor already
     * received createStyle(INITIAL_REPRESENTATION), so we
     * should not immediately replace that exact same style.
     */
    if (
        activeRepresentation === null
    ) {
        activeRepresentation =
            representation.id;
        return representation;
    }
    /*
     * Representation changes use a complete style rebuild.
     *
     * MapLibre preserves the map object, controls and camera.
     * Sources and layers are recreated according to the new
     * representation.
     */
    map.setStyle(
        createStyle(
            representation.id
        )
    );
    activeRepresentation =
        representation.id;
    return representation;
}
