import {
    poiIconExpression
} from '../../icons/poi-icons.mjs';

import {
    poiVisibilityBands
} from './visibility.mjs';


function createPoiIconLayer(
    band
) {
    const layer = {
        id:
            `poi-icons-${band.id}`,

        type:
            'symbol',

        source:
            'poi_render',

        'source-layer':
            'poi_render',

        minzoom:
            band.minzoom,

        layout: {
            'icon-image':
                poiIconExpression,


            /*
             * Sprite glyph is approximately 20px at size 1.
             */
            'icon-size': [
                'interpolate',
                ['linear'],
                ['zoom'],

                13, 0.6,
                14, 0.65,
                16, 0.75,
                18, 0.85,
                20, 1
            ],


            /*
             * Lower label_rank = more important.
             *
             * This gives MapLibre a stable ordering when
             * symbols compete for space.
             */
            'symbol-sort-key': [
                'coalesce',
                ['get', 'label_rank'],
                999
            ],


            'icon-anchor':
                'center',


            /*
             * IMPORTANT:
             *
             * Normal POIs now participate in collision
             * detection instead of forcing every symbol onto
             * the screen.
             */
            'icon-allow-overlap':
                band.id === 'street',

            'icon-ignore-placement':
                band.id === 'street',

            'icon-padding':
                band.id === 'street'
                    ? 0
                    : 1
        }
    };


    if (
        band.maxzoom !== undefined
    ) {
        layer.maxzoom =
            band.maxzoom;
    }


    if (band.filter) {
        layer.filter =
            band.filter;
    }


    return layer;
}


export const poiIconLayers =
    poiVisibilityBands.map(
        createPoiIconLayer
    );