import {
    clearSelection,
    selectPoi,
    selectRoad,
    selectSportsFacility,
    selectTransitStop
} from '../selection/index.mjs';


/*
 * Interaction priority.
 *
 * The order here is semantic, not visual.
 *
 * Only layers that actually exist in the current MapLibre
 * style are queried. This is important for representations
 * such as satellite, which deliberately omit physical
 * geometry and its hit areas.
 */
const INTERACTIVE_LAYERS = [
    {
        id: 'transit-stop-hit-area',
        type: 'transit_stop'
    },
    {
        id: 'poi-hit-area',
        type: 'poi'
    },
    {
        id: 'sports-hit-area',
        type: 'sports_facility'
    },
    {
        id: 'road-hit-area',
        type: 'road'
    }
];


/*
 * Return only interactive layers that exist in the
 * currently loaded style.
 *
 * Examples:
 *
 * 2D / 3D:
 *   transit
 *   POI
 *   sports
 *   roads
 *
 * Satellite:
 *   transit
 *   POI
 */
function getActiveInteractiveLayerIds(map) {
    return INTERACTIVE_LAYERS
        .filter(
            interaction =>
                map.getLayer(
                    interaction.id
                )
        )
        .map(
            interaction =>
                interaction.id
        );
}


/*
 * Find the highest-priority semantic target from the
 * rendered features returned by MapLibre.
 */
function findInteractiveFeature(features) {
    for (
        const interaction
        of INTERACTIVE_LAYERS
    ) {
        const feature =
            features.find(
                candidate =>
                    candidate.layer?.id ===
                    interaction.id
            );


        if (feature) {
            return {
                type:
                    interaction.type,

                feature
            };
        }
    }


    return null;
}


/*
 * Query interactive features using only layers that are
 * actually present in the current representation.
 */
function queryInteractiveFeatures(
    map,
    point
) {
    const layers =
        getActiveInteractiveLayerIds(
            map
        );


    /*
     * No interactive layers exist in this representation.
     */
    if (layers.length === 0) {
        return [];
    }


    return map.queryRenderedFeatures(
        point,
        {
            layers
        }
    );
}


function applyInteractionSelection(
    map,
    target
) {
    switch (target.type) {
        case 'transit_stop':
            return selectTransitStop(
                map,
                target.feature
            );

        case 'poi':
            return selectPoi(
                map,
                target.feature
            );

        case 'sports_facility':
            return selectSportsFacility(
                map,
                target.feature
            );

        case 'road':
            return selectRoad(
                map,
                target.feature
            );

        default:
            return null;
    }
}


export function enableInteractions(
    map,
    {
        onSelect = () => {},
        onClear = () => {}
    } = {}
) {
    /*
     * One click handler owns map interaction.
     *
     * This prevents overlapping MapLibre layers from
     * independently processing the same click.
     */
    map.on(
        'click',
        (event) => {
            const features =
                queryInteractiveFeatures(
                    map,
                    event.point
                );


            const target =
                findInteractiveFeature(
                    features
                );


            if (!target) {
                clearSelection(map);
                onClear();

                return;
            }


            /*
             * Selection is exclusive.
             */
            clearSelection(map);


            const selection =
                applyInteractionSelection(
                    map,
                    target
                );


            if (selection) {
                onSelect(selection);
            }
        }
    );


    /*
     * Cursor handling uses exactly the same query as clicks.
     */
    map.on(
        'mousemove',
        (event) => {
            const features =
                queryInteractiveFeatures(
                    map,
                    event.point
                );


            map.getCanvas().style.cursor =
                features.length > 0
                    ? 'pointer'
                    : '';
        }
    );
}