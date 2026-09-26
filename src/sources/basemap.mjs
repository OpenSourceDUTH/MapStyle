const MARTIN =
    'http://204.216.215.153:3000';


function vectorSource(name) {
    return {
        type: 'vector',
        url: `${MARTIN}/${name}`,
        encoding: 'mlt'
    };
}


const sourceCatalogue = {
    ocean:
        vectorSource('ocean'),

    land:
        vectorSource('land'),

    water:
        vectorSource('water'),

    waterways:
        vectorSource('waterways'),

    coastline:
        vectorSource('coastline'),


    /*
     * Regional satellite imagery.
     */
    'regional-satellite': {
        type: 'raster',

        tiles: [
            'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],

        tileSize: 256,

        maxzoom: 19
    },


    /*
     * Grid-aligned campus orthophoto served by Martin.
     */
    'campus-aerial': {
        type: 'raster',

        tiles: [
            `${MARTIN}/campus_aerial_grid_test/{z}/{x}/{y}`
        ],

        tileSize: 512,

        minzoom: 14,

        maxzoom: 22
    },


    running_track_lanes:
        vectorSource('running_track_lanes'),

    bleacher_rows:
        vectorSource('bleacher_rows'),


    transportation:
        vectorSource('transportation'),

    transportation_areas:
        vectorSource('transportation_areas'),

    road_surfaces:
        vectorSource('road_surfaces'),

    sidewalk_surfaces:
        vectorSource('sidewalk_surfaces'),

    crossing_markings:
        vectorSource('crossing_markings'),

    named_roads:
        vectorSource('named_roads'),

    named_road_surfaces:
        vectorSource('named_road_surfaces'),


    buildings:
        vectorSource('buildings'),


    poi:
        vectorSource('poi'),

    poi_render:
        vectorSource('poi_render'),


    barriers:
        vectorSource('barriers'),

    barrier_points:
        vectorSource('barrier_points'),


    place_labels:
        vectorSource('place_labels'),

    area_labels:
        vectorSource('area_labels'),

    transit_stops:
        vectorSource('transit_stops'),

    building_labels:
        vectorSource('building_labels')
};


export function createSources(
    representation
) {
    const sources = {};


    const semanticSources = [
        'poi_render',
        'transit_stops',
        'place_labels',
        'area_labels',
        'building_labels',
        'named_roads'
    ];


    for (const name of semanticSources) {
        sources[name] =
            sourceCatalogue[name];
    }


    /*
     * Satellite mode.
     */
    if (
        representation.surface ===
        'satellite'
    ) {
        sources['regional-satellite'] =
            sourceCatalogue[
                'regional-satellite'
            ];

        return sources;
    }


    /*
     * Aerial mode.
     *
     * Regional satellite is the background.
     * Campus orthophoto is rendered above it.
     */
    if (
        representation.surface ===
        'aerial'
    ) {
        sources['regional-satellite'] =
            sourceCatalogue[
                'regional-satellite'
            ];

        sources['campus-aerial'] =
            sourceCatalogue[
                'campus-aerial'
            ];

        return sources;
    }


    /*
     * Vector modes.
     */
    const vectorSources = [
        'ocean',
        'land',
        'water',
        'waterways',
        'coastline',

        'running_track_lanes',
        'bleacher_rows',

        'transportation',
        'transportation_areas',
        'road_surfaces',
        'sidewalk_surfaces',
        'crossing_markings',
        'named_road_surfaces',

        'buildings',

        'barriers',
        'barrier_points'
    ];


    for (const name of vectorSources) {
        sources[name] =
            sourceCatalogue[name];
    }


    return sources;
}