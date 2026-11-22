/*
 * Photorealistic 3D Tiles over the regional satellite background.
 *
 * The custom layer is installed by dev.mjs when this representation is
 * active and VITE_3D_TILES_URL is configured.
 */
export const representationPhotorealistic3D = {
    id: 'photorealistic-3d',
    // Keep the regional satellite raster as the only 2D surface. The
    // photorealistic mesh supplies the 3D surface on top of it.
    surface: 'satellite',
    // Keep the OSM transport and footprint layers available over the mesh.
    // The aerial surface remains the visual base, while these layers provide
    // the map context used by the other representations.
    physicalGeometry: false,
    buildings: 'none',
    semanticOverlays: true,
    labels: false,
    // Keep POI icons and names while suppressing road, building, and transit
    // labels in the photorealistic view.
    poiLabels: true,
    transitOverlays: false,
    physicalSelections: false,
    photorealisticTiles: true
};
