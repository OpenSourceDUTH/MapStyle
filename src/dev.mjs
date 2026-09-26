import * as maplibregl from 'maplibre-gl';

import 'maplibre-gl/dist/maplibre-gl.css';
import './dev.css';

import {
    createStyle
} from './style.mjs';

import {
    enableInteractions
} from './interactions/index.mjs';

import {
    setRepresentation,
    getActiveRepresentation
} from './representations/runtime.mjs';

import {
    getRepresentationIds
} from './representations/index.mjs';


const MARTIN =
    'http://204.216.215.153:3000';


const MARTIN_RASTER_SOURCES = [
    '/campus_aerial/',
    '/campus_aerial_grid_test/'
];


const INITIAL_REPRESENTATION =
    'aerial';


const map = new maplibregl.Map({
    container: 'map',

    style: createStyle(
        INITIAL_REPRESENTATION
    ),

    center: [
        24.379906654357907,
        40.92930462754756
    ],

    /*
     * Start in the middle of the verified aerial pyramid.
     *
     * This lets us inspect both lower and higher zooms.
     */
    zoom: 18,

    transformRequest(
        url,
        resourceType
    ) {
        /*
         * Martin serves both MLT vector tiles and raster
         * imagery from the same server.
         */
        const isMartin =
            url.startsWith(
                MARTIN
            );


        /*
         * Raster requests must not receive the MLT Accept
         * header.
         */
        const isMartinRaster =
            MARTIN_RASTER_SOURCES.some(
                path =>
                    url.includes(path)
            );


        /*
         * Request MLT only for Martin vector tiles.
         */
        if (
            isMartin &&
            !isMartinRaster &&
            resourceType === 'Tile'
        ) {
            return {
                url,

                headers: {
                    Accept:
                        'application/vnd.maplibre-tile'
                }
            };
        }


        return {
            url
        };
    }
});


map.addControl(
    new maplibregl.NavigationControl(),
    'top-right'
);


/*
 * The Map constructor already received the aerial style.
 *
 * Register aerial as the active representation without
 * unnecessarily replacing the initial style.
 */
setRepresentation(
    map,
    INITIAL_REPRESENTATION
);


map.on(
    'load',
    () => {
        console.log(
            'Map loaded'
        );

        console.log(
            'Representation:',
            getActiveRepresentation()
        );

        console.log(
            'Available representations:',
            getRepresentationIds()
        );


        enableInteractions(
            map,
            {
                onSelect(selection) {
                    console.log(
                        'Selected:',
                        selection
                    );
                },

                onClear() {
                    console.log(
                        'Selection cleared'
                    );
                }
            }
        );
    }
);


map.on(
    'error',
    (event) => {
        console.error(
            'MapLibre error:',
            event.error ?? event
        );
    }
);


/*
 * Development access.
 *
 * These globals are temporary and make representation
 * switching easy to test from the browser console.
 */
window.map = map;


window.setRepresentation = (
    representation
) => {
    const result =
        setRepresentation(
            map,
            representation
        );


    console.log(
        'Representation:',
        result.id
    );


    return result;
};


window.getRepresentation =
    getActiveRepresentation;


window.getRepresentations =
    getRepresentationIds;