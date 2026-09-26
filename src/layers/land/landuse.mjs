import { colors } from '../../tokens/colors.mjs';

export const landuseLayers = [
    {
        id: 'landuse-residential',
        type: 'fill',
        source: 'land',
        'source-layer': 'land',
        filter: ['==', ['get', 'landuse'], 'residential'],
        paint: {
            'fill-color': colors.residential,
            'fill-opacity': 0.45
        }
    },

    {
        id: 'landuse-commercial',
        type: 'fill',
        source: 'land',
        'source-layer': 'land',
        filter: ['==', ['get', 'landuse'], 'commercial'],
        paint: {
            'fill-color': colors.commercial,
            'fill-opacity': 0.55
        }
    },

    {
        id: 'landuse-industrial',
        type: 'fill',
        source: 'land',
        'source-layer': 'land',
        filter: ['==', ['get', 'landuse'], 'industrial'],
        paint: {
            'fill-color': colors.industrial,
            'fill-opacity': 0.65
        }
    }
];