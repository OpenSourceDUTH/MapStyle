const MATCH_NOTHING = ['==', ['literal', 1], ['literal', 0]];
const zoomInterpolate = stops => ['interpolate', ['linear'], ['zoom'], ...stops];

export const selectedPoiBaseRadius = zoomInterpolate([13, 18, 14, 20, 16, 24, 18, 28, 20, 32]);
export const selectedPoiInnerRadius = zoomInterpolate([13, 5, 14, 5.5, 16, 6.5, 18, 7.5, 20, 8.5]);
export const selectedPoiAnchorRadius = zoomInterpolate([13, 2.2, 14, 2.4, 16, 2.8, 18, 3.2, 20, 3.6]);
export const selectedPoiBaseSize = selectedPoiBaseRadius;

const source = {source: 'places', 'source-layer': 'places'};
const selectedCircle = (id, paint) => ({
    id,
    type: 'circle',
    ...source,
    filter: MATCH_NOTHING,
    paint
});
const labelExpression = ['coalesce', ['get', 'name'], ['get', 'name:el'], ['get', 'name:en'], ['get', 'brand'], ['get', 'operator'], ''];

export const poiSelectionLayers = [
    {
        id: 'poi-hit-area',
        type: 'circle',
        ...source,
        minzoom: 13,
        paint: {
            'circle-radius': zoomInterpolate([13, 12, 15, 14, 17, 17, 19, 20, 21, 24]),
            'circle-color': '#000000',
            'circle-opacity': 0.001
        }
    },
    selectedCircle('selected-poi-anchor', {
        'circle-radius': selectedPoiAnchorRadius,
        'circle-color': '#53c96b',
        'circle-stroke-color': '#1b4022',
        'circle-stroke-width': 1.4
    }),
    selectedCircle('selected-poi-marker', {
        'circle-radius': selectedPoiBaseRadius,
        'circle-color': '#65d46e',
        'circle-stroke-color': '#1b4022',
        'circle-stroke-width': 2.5,
        'circle-translate': [0, 0],
        'circle-translate-anchor': 'viewport'
    }),
    selectedCircle('selected-poi-marker-inner', {
        'circle-radius': selectedPoiInnerRadius,
        'circle-color': '#17361c',
        'circle-translate': [0, 0],
        'circle-translate-anchor': 'viewport'
    }),
    {
        id: 'selected-poi-label',
        type: 'symbol',
        ...source,
        filter: MATCH_NOTHING,
        layout: {
            'text-field': labelExpression,
            'text-font': ['Noto Sans Bold'],
            'text-size': 13,
            'text-anchor': 'top',
            'text-offset': [0, 0],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
            'symbol-placement': 'point'
        },
        paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#1b1f27',
            'text-halo-width': 2,
            'text-halo-blur': 0.35,
            'text-translate': [0, 0],
            'text-translate-anchor': 'viewport'
        }
    }
];

export const selectedPoiLayers = poiSelectionLayers;
export default poiSelectionLayers;
