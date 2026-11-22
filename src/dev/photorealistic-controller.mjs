export function createPhotorealisticInstaller({map, getRepresentation, getActiveRepresentation, createLayer, config}) {
    let photorealisticTilesLayer = null;
    let missingPhotorealisticTilesUrlWarningShown = false;
    const { initialRepresentation, tilesUrl, tilesOrigin, errorTarget } = config;

    function installPhotorealisticTiles() {
        const representation = getRepresentation(
            getActiveRepresentation() ?? initialRepresentation
        );
        if (!representation.photorealisticTiles) {
            if (photorealisticTilesLayer && map.getLayer(photorealisticTilesLayer.id)) {
                map.removeLayer(photorealisticTilesLayer.id);
            }
            photorealisticTilesLayer = null;
            return;
        }
        // `isStyleLoaded()` is not consistently implemented across MapLibre
        // versions. The style-load/idle events already guarantee a style exists;
        // checking the style object avoids silently skipping the custom layer.
        if (!tilesUrl || !map.getStyle()) {
            if (!tilesUrl && !missingPhotorealisticTilesUrlWarningShown) {
                missingPhotorealisticTilesUrlWarningShown = true;
                console.warn(
                    '[3D Tiles] photorealistic-3d is selected, but VITE_3D_TILES_URL is not configured; no mesh layer was added.'
                );
            }
            return;
        }
        if (photorealisticTilesLayer && map.getLayer(photorealisticTilesLayer.id)) {
            return;
        }
        // setStyle removes custom layers. Recreate the layer on the next style.
        photorealisticTilesLayer = null;
        photorealisticTilesLayer = createLayer({
            url: tilesUrl,
            origin: tilesOrigin,
            errorTarget: errorTarget,
            debug: import.meta.env.DEV
        });
        // Add after both raster layers and before the first symbol layer. This is
        // the only ordering that guarantees labels remain over the mesh while the
        // mesh remains over campus-aerial.
        const beforeId = map.getStyle().layers.find(layer => layer.type === 'symbol')?.id;
        map.addLayer(photorealisticTilesLayer, beforeId);
        map.triggerRepaint();
        console.info('[3D Tiles] enabled', {
            url: tilesUrl,
            origin: tilesOrigin,
            beforeId: beforeId ?? null
        });
    }
    
    return { installPhotorealisticTiles, getLayer: () => photorealisticTilesLayer };
}
