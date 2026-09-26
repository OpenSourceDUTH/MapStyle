import {
    poiMarkerImageExpression
} from '../../icons/poi-icons.mjs';

import {
    poiVisibilityBands
} from './visibility.mjs';


function createPoiMarkerLayer(
    band
) {
    const layer = {
        id:
            `poi-markers-${band.id}`,

        type:
            'symbol',

        source:
            'poi_render',

        'source-layer':
            'poi_render',

        minzoom:
            band.minzoom,

        layout: {
            /*
             * Composite sprite:
             *
             * category-coloured circle
             * +
             * white Maki glyph
             */
            'icon-image':
                poiMarkerImageExpression,


            /*
             * Keep the markers readable without making their
             * collision boxes unnecessarily huge.
             */
            'icon-size': [
                'interpolate',
                ['linear'],
                ['zoom'],

                13, 0.68,
                14, 0.72,
                16, 0.78,
                18, 0.85,
                20, 0.95
            ],


            /*
             * Lower label_rank = more important.
             *
             * Important POIs therefore get first chance at
             * occupying space.
             */
            'symbol-sort-key': [
                'coalesce',
                ['get', 'label_rank'],
                999
            ],


            /*
             * Normal POIs participate in collision detection.
             */
            'icon-allow-overlap':
                false,

            'icon-ignore-placement':
                false,


            /*
             * Do not reserve excessive empty space around
             * markers.
             *
             * The sprite itself is already circular and
             * visually separated.
             */
            'icon-padding':
                1
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


export const poiMarkerLayers =
    poiVisibilityBands.map(
        createPoiMarkerLayer
    );