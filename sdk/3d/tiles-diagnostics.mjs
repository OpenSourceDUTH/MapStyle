export function getTilesDiagnostics(layer) {
    if (!layer.maplibre) {
        return { url: layer.url, origin: { ...layer.origin }, enabled: false, reason: 'layer not added' };
    }
    return {
        url: layer.url,
        origin: { ...layer.origin },
        mercatorOrigin: layer.maplibreMercatorOrigin,
        meterScale: layer.maplibreMeterScale,
        modelMatrix: layer.model.toArray(),
        errorTarget: layer.errorTarget,
        maxTilesProcessed: layer.maxTilesProcessed,
        loadedTiles: layer.stats.loaded,
        visibleTiles: layer.stats.visible,
        traversal: layer.tiles?.stats ? { ...layer.tiles.stats } : null,
        activeTiles: layer.tiles?.activeTiles?.size ?? 0,
        parsingTiles: layer.tiles?.loadingTiles?.size ?? 0,
        groupChildren: layer.tiles?.group?.children?.length ?? 0,
        groupMeshes: layer.tiles?.group ? (() => {
            let meshes = 0;
            layer.tiles.group.traverse(object => { if (object.isMesh) meshes++; });
            return meshes;
        })() : 0,
        sharedTexture: {
            url: layer.sharedTextureUrl,
            loaded: Boolean(layer.sharedTexture),
            dimensions: layer.sharedTexture?.image ? [
                layer.sharedTexture.image.width,
                layer.sharedTexture.image.height
            ] : null
        },
        activeContentUris: layer.tiles?.activeTiles ? [...layer.tiles.activeTiles]
            .slice(0, 12)
            .map(tile => tile.content?.uri ?? tile.content?.url ?? tile.url ?? null) : [],
        tileSamples: layer.tiles?.root ? [layer.tiles.root, ...(layer.tiles.root.children ?? [])].slice(0, 4).map(tile => ({
            hasContent: Boolean(tile.content),
            hasRenderableContent: Boolean(tile.internal?.hasRenderableContent),
            loadingState: tile.internal?.loadingState,
            refine: tile.refine,
            used: tile.traversal?.used,
            inFrustum: tile.traversal?.inFrustum,
            active: tile.traversal?.active,
            visible: tile.traversal?.visible,
            contentGroupChildren: tile.content?.scene?.children?.length ?? tile.engineData?.scene?.children?.length ?? null
        })) : [],
        inFrustumLoaded: layer.tiles?.root ? (() => {
            const result = [];
            const visit = tile => {
                if (result.length >= 4) return;
                if (tile.traversal?.inFrustum && tile.internal?.hasContent) {
                    result.push({
                        refine: tile.refine,
                        loadingState: tile.internal.loadingState,
                        hasRenderableContent: tile.internal.hasRenderableContent,
                        active: tile.traversal.active,
                        visible: tile.traversal.visible,
                        used: tile.traversal.used
                    });
                }
                for (const child of tile.children ?? []) visit(child);
            };
            visit(layer.tiles.root);
            return result;
        })() : [],
        renders: layer.stats.renders,
        matrixType: layer.stats.matrixType,
        matrixKeys: layer.stats.matrixKeys,
        hasProjection: layer.stats.hasProjection,
        hasModelViewProjection: layer.stats.hasModelViewProjection,
        rootTransform: layer.tiles?.root?.transform ?? null,
        rootBoundingVolume: layer.tiles?.root?.boundingVolume ?? null,
        rootGeometricError: layer.tiles?.root?.geometricError ?? null,
        rootRefine: layer.tiles?.root?.refine ?? null
    };
}

export function logTilesDiagnostics(layer, event) {
    if (!layer.debug) return;
    console.debug('[3D Tiles]', event, getTilesDiagnostics(layer));
}
