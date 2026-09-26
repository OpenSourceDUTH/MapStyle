const MATCH_NOTHING = [
    '==',
    ['literal', 1],
    ['literal', 0]
];

export function clearBuildingHighlight(map) {
    map.setFilter(
        'selected-building-fill',
        MATCH_NOTHING
    );

    map.setFilter(
        'selected-building-outline',
        MATCH_NOTHING
    );

    map.setFilter(
        'selected-building-3d',
        MATCH_NOTHING
    );
}

export function highlightBuilding(map, buildingId) {
    if (
        buildingId === undefined ||
        buildingId === null
    ) {
        clearBuildingHighlight(map);
        return;
    }

    const filter = [
        '==',
        ['get', 'area_id'],
        buildingId
    ];

    map.setFilter(
        'selected-building-fill',
        filter
    );

    map.setFilter(
        'selected-building-outline',
        filter
    );

    map.setFilter(
        'selected-building-3d',
        filter
    );
}