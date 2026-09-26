const MATCH_NOTHING = [
    '==',
    ['literal', 1],
    ['literal', 0]
];

export const roadSelectionLayers = [
    {
        id: 'road-hit-area',
        type: 'line',
        source: 'named_roads',
        'source-layer': 'named_roads',

        paint: {
            'line-color': '#000000',
            'line-opacity': 0,
            'line-width': 20
        }
    },

    {
        id: 'selected-road',
        type: 'fill',
        source: 'named_road_surfaces',
        'source-layer': 'named_road_surfaces',

        filter: MATCH_NOTHING,

        paint: {
            'fill-color': '#4da3ff',
            'fill-opacity': 0.4
        }
    }
];