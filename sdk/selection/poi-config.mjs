export const MATCH_NOTHING = [
    '==',
    ['literal', 1],
    ['literal', 0]
];

export const POI_BASE_SIZE = 0.95;

export const POI_LABEL = [
    'coalesce',
    ['get', 'display_name'],
    ['get', 'name'],
    ['get', 'name:el'],
    ['get', 'name:en'],
    ['get', 'brand'],
    ['get', 'operator'],
    ''
];

export const POI_ACCENT = [
    'coalesce',
    ['get', 'marker_color'],
    ['get', 'marker_colour'],
    ['get', 'category_color'],
    ['get', 'category_colour'],
    ['get', 'color'],
    '#e99b4d'
];
