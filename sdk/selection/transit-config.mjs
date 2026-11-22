export const MATCH_NOTHING = [
    '==',
    ['literal', 1],
    ['literal', 0]
];

export const TRANSIT_LABEL = [
    'coalesce',
    ['get', 'display_name'],
    ['get', 'name'],
    ['get', 'name:el'],
    ['get', 'name:en'],
    ['get', 'ref'],
    ''
];

export const TRANSIT_ACCENT = [
    'coalesce',
    ['get', 'marker_color'],
    ['get', 'marker_colour'],
    ['get', 'color'],
    '#4b9ed8'
];
