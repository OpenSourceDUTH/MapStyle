/*
 * POI category colours.
 *
 * These colours are used while building the composite POI
 * marker sprites.
 */

export const poiColorByCategory = {
    food: '#d79a62',
    health: '#d98282',
    education: '#78a9d1',
    shopping: '#b695cf',
    tourism: '#70b5a8',
    service: '#91a7ba',
    utility: '#8297a8',
    leisure: '#72aa8b',
    other: '#8ea2b2'
};


export const poiCategories =
    Object.keys(
        poiColorByCategory
    );


export const poiCategoryExpression = [
    'match',
    ['get', 'category'],

    'food', 'food',
    'health', 'health',
    'education', 'education',
    'shopping', 'shopping',
    'tourism', 'tourism',
    'service', 'service',
    'utility', 'utility',
    'leisure', 'leisure',

    'other'
];