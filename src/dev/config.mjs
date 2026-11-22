export const MARTIN_REMOTE = import.meta.env.VITE_MARTIN_URL ?? 'https://tiles.leokratis.com';
export const MARTIN = import.meta.env.DEV ? '/martin' : MARTIN_REMOTE;
export const MARTIN_RASTER_SOURCES = ['/campus_aerial/', '/campus_aerial_grid_test/', '/campus_aerial_allzoom/'];
// The public site starts with the portable 2D style. Photorealistic 3D tiles
// remain available as an opt-in development representation.
export const INITIAL_REPRESENTATION = '2d';
export const PHOTOREALISTIC_TILES_URL = import.meta.env.VITE_3D_TILES_URL;
export const PHOTOREALISTIC_TILES_ORIGIN = {
    longitude: Number(import.meta.env.VITE_3D_TILES_ORIGIN_LON ?? 24.3787057),
    latitude: Number(import.meta.env.VITE_3D_TILES_ORIGIN_LAT ?? 40.9294296),
    height: Number(import.meta.env.VITE_3D_TILES_ORIGIN_HEIGHT ?? 0)
};
export const PHOTOREALISTIC_TILES_ERROR_TARGET = Number(import.meta.env.VITE_3D_TILES_ERROR_TARGET ?? 16);
