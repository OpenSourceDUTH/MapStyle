/*
 * Satellite representation.
 */
export const satelliteLayers = [
    {
        id: 'regional-satellite',

        type: 'raster',

        source: 'regional-satellite',

        paint: {
            'raster-opacity': 1,
            'raster-fade-duration': 0
        }
    }
];


/*
 * Aerial representation.
 *
 * Layer order matters:
 *
 * 1. regional satellite
 * 2. high-resolution campus orthophoto
 */
export const aerialLayers = [
    {
        id: 'aerial-background-satellite',

        type: 'raster',

        source: 'regional-satellite',

        paint: {
            'raster-opacity': 1
        }
    },

    {
        id: 'campus-aerial',

        type: 'raster',

        source: 'campus-aerial',

        paint: {
            'raster-opacity': 1,
            'raster-fade-duration': 0
        }
    }
];
