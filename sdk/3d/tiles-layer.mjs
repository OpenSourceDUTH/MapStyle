import * as THREE from 'three';
import { TilesRenderer } from '3d-tiles-renderer/three';
import { LRUCache } from '3d-tiles-renderer/core';
import * as maplibregl from 'maplibre-gl';
import { logTilesDiagnostics, getTilesDiagnostics } from './tiles-diagnostics.mjs';
THREE.Cache.enabled = true;

export class PhotorealisticTilesLayer {
    constructor({
        id = 'photorealistic-3d-tiles',
        url,
        origin,
        debug = false,
        errorTarget = 16,
        maxTilesProcessed = 250
    }) {
        if (!url) throw new Error('A 3D Tiles URL is required');
        if (!origin || !Number.isFinite(origin.longitude) || !Number.isFinite(origin.latitude)) {
            throw new Error('A 3D Tiles origin with longitude and latitude is required');
        }
        this.id = id;
        this.type = 'custom';
        this.renderingMode = '3d';
        this.url = url;
        this.origin = origin;
        this.debug = debug;
        this.errorTarget = errorTarget;
        this.baseErrorTarget = errorTarget;
        this.maxTilesProcessed = maxTilesProcessed;
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();
        this.camera.matrixAutoUpdate = false;
        this.model = new THREE.Matrix4();
        this.projection = new THREE.Matrix4();
        this.modelViewProjection = new THREE.Matrix4();
        this.view = new THREE.Matrix4();
        this.stats = { loaded: 0, visible: 0, renders: 0 };
        this.sharedTexture = null;
        this.sharedTextureUrl = null;
    }
    onAdd(map, gl) {
        this.map = map;
        this.maplibre = maplibregl;
        this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: false
        });
        this._onZoom = () => {
            this.map.triggerRepaint();
        };
        map.on('zoom', this._onZoom);
        this.renderer.autoClear = false;
        this.renderer.setPixelRatio(1);
        this.sharedTextureUrl = new URL(
            'baseColor.jpg',
            new URL(this.url, window.location.href)
        ).href;
        new THREE.TextureLoader().load(
            this.sharedTextureUrl,
            texture => {
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.flipY = false;
                texture.needsUpdate = true;
                this.sharedTexture = texture;
                this._applySharedTexture();
                this.map?.triggerRepaint();
            },
            undefined,
            error => console.warn('[3D Tiles] shared texture load failed', this.sharedTextureUrl, error)
        );
        this.tiles = new TilesRenderer(this.url);
        this.tiles.fetchOptions = {
            cache: 'force-cache'
        };
        const calculateTileViewError = this.tiles.calculateTileViewError.bind(this.tiles);
        this.tiles.calculateTileViewError = (tile, target) => {
            calculateTileViewError(tile, target);
            target.inView = true;
            target.error = Infinity;
            target.distanceFromCamera = 0;
        };
        this.tiles.lruCache = new LRUCache();
        this.tiles.lruCache.minSize = 64;
        this.tiles.lruCache.maxSize = 512;
        this.tiles.lruCache.minBytesSize = 0;
        this.tiles.lruCache.maxBytesSize = 2.5 * 1024 * 1024 * 1024;
        this.tiles.lruCache.unloadPriorityCallback = () => 0;
        this.tiles.errorTarget = this.errorTarget;
        this.tiles.maxTilesProcessed = this.maxTilesProcessed;
        this.tiles.loadSiblings = true;
        this.tiles.loadAncestors = true;
        this.tiles.autoDisableRendererCulling = true;
        this.tiles.displayActiveTiles = true;
        this.tiles.group.matrixAutoUpdate = false;
        this.tiles.group.matrix.identity();
        this.tiles.setCamera(this.camera);
        this.tiles.setResolution(this.camera, map.getCanvas().width, map.getCanvas().height);
        this.scene.add(this.tiles.group);
        this._updateModelMatrix();
        const repaint = event => {
            this._logDiagnostics(event.type);
            this.map.triggerRepaint();
        };
        this.tiles.addEventListener('needs-update', repaint);
        this.tiles.addEventListener('load-tileset', repaint);
        this.tiles.addEventListener('load-root-tileset', repaint);
        this.tiles.addEventListener('load-model', repaint);
        this.tiles.addEventListener('dispose-model', repaint);
        this.tiles.addEventListener('tiles-load-end', repaint);
        this.tiles.addEventListener('load-error', event => {
            console.error('[3D Tiles] load error', event);
            repaint(event);
        });
        this.tiles.addEventListener('load-model', event => {
            this._useUnlitPhotogrammetryMaterials(event.scene);
            this._downsampleTileTextures(event.scene, event.tile);
        });
    }
    _useUnlitPhotogrammetryMaterials(scene) {
        scene.traverse(object => {
            if (!object.isMesh) return;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            const converted = materials.map(material => {
                if (!material || material.isMeshBasicMaterial) return material;
                const replacement = new THREE.MeshBasicMaterial({
                    map: material.map ?? this.sharedTexture,
                    color: material.color ?? 0xffffff,
                    opacity: material.opacity ?? 1,
                    transparent: material.transparent ?? false,
                    alphaTest: material.alphaTest ?? 0,
                    side: THREE.DoubleSide,
                    vertexColors: material.vertexColors === true,
                    depthTest: material.depthTest,
                    depthWrite: material.depthWrite,
                    toneMapped: false
                });
                replacement.name = material.name;
                material.dispose();
                return replacement;
            });
            object.material = Array.isArray(object.material) ? converted : converted[0];
        });
    }
    _applySharedTexture() {
        if (!this.sharedTexture || !this.tiles?.group) return;
        this.tiles.group.traverse(object => {
            if (!object.isMesh) return;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            for (const material of materials) {
                if (!material || material.map) continue;
                material.map = this.sharedTexture;
                material.needsUpdate = true;
            }
        });
    }
    _downsampleTileTextures(scene, tile) {
        const maxDimension = 1024;
        scene.traverse(object => {
            if (!object.isMesh) return;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            for (const material of materials) {
                const texture = material?.map;
                const image = texture?.image;
                if (texture === this.sharedTexture) continue;
                if (!image || Math.max(image.width || 0, image.height || 0) <= maxDimension) continue;
                const scale = maxDimension / Math.max(image.width, image.height);
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(image.width * scale));
                canvas.height = Math.max(1, Math.round(image.height * scale));
                const context = canvas.getContext('2d');
                if (!context) continue;
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                const replacement = new THREE.CanvasTexture(canvas);
                replacement.colorSpace = texture.colorSpace;
                replacement.wrapS = texture.wrapS;
                replacement.wrapT = texture.wrapT;
                replacement.minFilter = texture.minFilter;
                replacement.magFilter = texture.magFilter;
                material.map = replacement;
                material.needsUpdate = true;
                texture.dispose();
            }
        });
        if (tile && this.tiles?.lruCache) {
            this.tiles.lruCache.setMemoryUsage(tile, 8 * 1024 * 1024);
        }
    }
    _updateModelMatrix() {
        const mercator = this.maplibreMercatorOrigin;
        const worldSize = 512 * 2 ** this.map.getZoom();
        const meterScale = this.maplibreMeterScale * worldSize;
        const mapFrame = new THREE.Matrix4().set(
            meterScale, 0, 0, mercator.x * worldSize,
            0, -meterScale, 0, mercator.y * worldSize,
            0, 0, 1, this.origin.height ?? 0,
            0, 0, 0, 1
        );
        this.model.copy(mapFrame);
    }
    get maplibreMercatorOrigin() {
        const c = this.maplibre.MercatorCoordinate.fromLngLat(
            [this.origin.longitude, this.origin.latitude],
            this.origin.height ?? 0
        );
        return c;
    }
    get maplibreMeterScale() {
        return this.maplibre.MercatorCoordinate.fromLngLat(
            [this.origin.longitude, this.origin.latitude],
            1
        ).meterInMercatorCoordinateUnits();
    }
    render(gl, matrix) {
        if (!this.tiles) return;
        this.stats.renders++;
        if (this.stats.renders === 1) {
            this.stats.matrixType = typeof matrix;
            this.stats.matrixKeys = matrix && Object.keys(matrix);
            this.stats.hasProjection = Boolean(matrix?.projectionMatrix);
            this.stats.hasModelViewProjection = Boolean(matrix?.modelViewProjectionMatrix);
        }
        const modelViewProjection = matrix?.modelViewProjectionMatrix ?? matrix;
        this._updateModelMatrix();
        this.camera.projectionMatrix.fromArray(modelViewProjection).multiply(this.model);
        this.camera.matrixWorld.identity();
        this.camera.matrixWorldInverse.identity();
        this.scene.updateMatrixWorld(true);
        this.tiles.setResolution(this.camera, this.map.getCanvas().width, this.map.getCanvas().height);
        this.tiles.update();
        this.scene.updateMatrixWorld(true);
        this.scene.traverse(object => {
            if (!object.isMesh) return;
            object.renderOrder = 0;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            for (const material of materials) {
                if (!material) continue;
                material.depthTest = true;
                material.depthWrite = true;
            }
        });
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
        this.renderer.resetState();
        this.stats.loaded = this.tiles.lruCache?.count ?? this.tiles.activeTiles?.size ?? 0;
        this.stats.visible = this.tiles.visibleTiles?.size ?? 0;
    }
    onRemove() {
        if (this.map && this._onZoom) this.map.off('zoom', this._onZoom);
        this.tiles?.dispose?.();
        this.scene.clear();
        this.sharedTexture?.dispose?.();
        this.sharedTexture = null;
        this.renderer?.dispose();
        this.tiles = null;
        this.renderer = null;
    }
    getDiagnostics() { return getTilesDiagnostics(this); }
    _logDiagnostics(event) { logTilesDiagnostics(this, event); }
}

export function createPhotorealisticTilesLayer(options) {
    return new PhotorealisticTilesLayer(options);
}
