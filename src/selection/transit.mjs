const MATCH_NOTHING = [
    '==',
    ['literal', 1],
    ['literal', 0]
];


export function clearTransitSelection(
    map
) {
    map.setFilter(
        'selected-transit-stop',
        MATCH_NOTHING
    );
}


export function selectTransitStop(
    map,
    feature
) {
    const stopId =
        feature.properties?.stop_id;


    if (
        stopId === undefined ||
        stopId === null
    ) {
        return null;
    }


    map.setFilter(
        'selected-transit-stop',

        [
            '==',
            ['get', 'stop_id'],
            stopId
        ]
    );


    return {
        type: 'transit-stop',

        id: stopId,

        name:
            feature.properties?.display_name
            ?? null,

        ref:
            feature.properties?.ref
            ?? null,

        properties:
            feature.properties,

        feature
    };
}