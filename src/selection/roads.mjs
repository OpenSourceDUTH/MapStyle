const MATCH_NOTHING = [
    '==',
    ['literal', 1],
    ['literal', 0]
];

export function clearRoadSelection(map) {
    map.setFilter(
        'selected-road',
        MATCH_NOTHING
    );
}

export function selectRoad(map, feature) {
    const roadId =
        feature.properties?.road_id;

    if (!roadId) {
        return null;
    }

    map.setFilter(
        'selected-road',
        [
            '==',
            ['get', 'road_id'],
            roadId
        ]
    );

    return {
        type: 'road',
        id: roadId,
        properties: feature.properties,
        feature
    };
}