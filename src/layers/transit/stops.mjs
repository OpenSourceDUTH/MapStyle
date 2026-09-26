/*
 * Bus stop rendering.
 *
 * Bus stops are their own transit infrastructure layer.
 *
 * Each marker is one composite sprite containing:
 *
 *   blue transit circle
 *   +
 *   white Maki bus glyph
 *
 * Therefore the complete marker participates in MapLibre's
 * symbol collision system as a single object.
 */


const BUS_STOP_ICON =
    'transit-bus-stop';


export const transitStopLayers = [
    /*
     * City / neighbourhood view.
     *
     * Stops compete for available screen space so dense parts
     * of Kavala do not become a wall of bus symbols.
     */
    {
        id: 'transit-bus-stops',

        type: 'symbol',

        source: 'transit_stops',
        'source-layer': 'transit_stops',

        minzoom: 14,
        maxzoom: 18,

        layout: {
            'icon-image':
                BUS_STOP_ICON,

            'icon-size': [
                'interpolate',
                ['linear'],
                ['zoom'],

                14, 0.68,
                16, 0.78,
                18, 0.88
            ],

            'icon-allow-overlap':
                false,

            'icon-ignore-placement':
                false,

            'icon-padding':
                2
        }
    },


    /*
     * Street-level view.
     *
     * At this scale the user is inspecting individual streets
     * and stops, so every stop should be available.
     */
    {
        id: 'transit-bus-stops-detail',

        type: 'symbol',

        source: 'transit_stops',
        'source-layer': 'transit_stops',

        minzoom: 18,

        layout: {
            'icon-image':
                BUS_STOP_ICON,

            'icon-size': [
                'interpolate',
                ['linear'],
                ['zoom'],

                18, 0.88,
                20, 1.00,
                22, 1.05
            ],

            'icon-allow-overlap':
                true,

            'icon-ignore-placement':
                true,

            'icon-padding':
                0
        }
    }
];