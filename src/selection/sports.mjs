const MATCH_NOTHING = [
    '==',
    ['literal', 1],
    ['literal', 0]
];


export function clearSportsSelection(map) {
    map.setFilter(
        'selected-sports-facility',
        MATCH_NOTHING
    );

    map.setFilter(
        'selected-sports-facility-outline',
        MATCH_NOTHING
    );
}


export function selectSportsFacility(
    map,
    feature
) {
    const areaId =
        feature.properties?.area_id;

    if (
        areaId === undefined ||
        areaId === null
    ) {
        return null;
    }

    const filter = [
        '==',
        ['get', 'area_id'],
        areaId
    ];

    map.setFilter(
        'selected-sports-facility',
        filter
    );

    map.setFilter(
        'selected-sports-facility-outline',
        filter
    );

    return {
        type: 'sports_facility',

        id: areaId,

        properties:
            feature.properties,

        feature
    };
}