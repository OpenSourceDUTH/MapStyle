import {
    createSources
} from './sources/basemap.mjs';

import {
    getRepresentation
} from './representations/index.mjs';

import {
    colors
} from './tokens/colors.mjs';

import {
    landLayers
} from './layers/land/index.mjs';

import {
    transportationLayers
} from './layers/transportation/index.mjs';

import {
    buildingFootprintLayers,
    buildingExtrusionLayers
} from './layers/buildings/index.mjs';

import {
    satelliteLayers,
    aerialLayers
} from './layers/imagery/index.mjs';

import {
    poiMarkerLayers
} from './layers/poi/markers.mjs';

import {
    poiLabelLayers
} from './layers/poi/labels.mjs';

import {
    transitLayers,
    transitLabelLayers
} from './layers/transit/index.mjs';

import {
    selectionLayers,
    semanticSelectionLayers
} from './layers/selection/index.mjs';

import {
    labelLayers
} from './layers/labels/index.mjs';


export function createStyle(
    representationId = '2d'
) {
    const representation =
        getRepresentation(
            representationId
        );


    const layers = [
        /*
         * Every representation needs a background.
         */
        {
            id: 'background',

            type: 'background',

            paint: {
                'background-color':
                    colors.background
            }
        }
    ];


    /*
     * Base surface.
     */
    if (
        representation.surface ===
        'satellite'
    ) {
        layers.push(
            ...satelliteLayers
        );
    }


    if (
        representation.surface ===
        'aerial'
    ) {
        layers.push(
            ...aerialLayers
        );
    }


    if (
        representation.surface ===
        'vector'
    ) {
        layers.push(
            {
                id: 'ocean',

                type: 'fill',

                source: 'ocean',
                'source-layer': 'ocean',

                paint: {
                    'fill-color':
                        colors.ocean
                }
            },

            ...landLayers
        );
    }


    /*
     * Physical vector geometry.
     *
     * Imagery representations deliberately exclude this
     * entire group.
     */
    if (
        representation.physicalGeometry
    ) {
        layers.push(
            ...transportationLayers
        );
    }


    /*
     * Buildings.
     */
    if (
        representation.buildings ===
        '2d'
    ) {
        layers.push(
            ...buildingFootprintLayers
        );
    }


    if (
        representation.buildings ===
        '3d'
    ) {
        layers.push(
            ...buildingFootprintLayers,
            ...buildingExtrusionLayers
        );
    }


    /*
     * Semantic overlays.
     *
     * These remain visible over imagery.
     */
    if (
        representation.semanticOverlays
    ) {
        layers.push(
            ...poiMarkerLayers,
            ...transitLayers
        );
    }


    /*
     * Selection layers.
     *
     * Imagery representations only receive selections for
     * semantic objects such as POIs and transit stops.
     */
    if (
        representation.physicalSelections
    ) {
        layers.push(
            ...selectionLayers
        );
    } else {
        layers.push(
            ...semanticSelectionLayers
        );
    }


    /*
     * Text labels.
     */
    if (
        representation.labels
    ) {
        layers.push(
            ...labelLayers,
            ...poiLabelLayers,
            ...transitLabelLayers
        );
    }


    return {
        version: 8,

        glyphs:
            'https://cdn.protomaps.com/fonts/pbf/{fontstack}/{range}.pbf',

        sprite:
            `${window.location.origin}/sprites/map`,

        /*
         * Only sources needed by this representation
         * are registered with MapLibre.
         */
        sources:
            createSources(
                representation
            ),

        layers
    };
}