import * as maplibregl from 'maplibre-gl';

import 'maplibre-gl/dist/maplibre-gl.css';
import './styles.css';

import {
    createStyle
} from '../style.mjs';

import {
    enableInteractions
} from '../../sdk/interactions/index.mjs';

import {
    setRepresentation,
    getActiveRepresentation
} from '../../sdk/representation-runtime.mjs';

import {
    getRepresentation,
    getRepresentationIds
} from '../representations/index.mjs';

import {
    createPhotorealisticTilesLayer
} from '../../sdk/3d/tiles-layer.mjs';

import {
    INITIAL_REPRESENTATION,
    MARTIN,
    MARTIN_RASTER_SOURCES,
    PHOTOREALISTIC_TILES_ERROR_TARGET,
    PHOTOREALISTIC_TILES_ORIGIN,
    PHOTOREALISTIC_TILES_URL
} from './config.mjs';

import { addRepresentationSelect } from './representation-control.mjs';

import { createPhotorealisticInstaller } from './photorealistic-controller.mjs';

const map = new maplibregl.Map({
    container: 'map',
    style: createStyle(
        INITIAL_REPRESENTATION
    ),
    center: [
        24.379906654357907,
        40.92930462754756
    ],
    zoom: 20,
    maxTileCacheZoomLevels: 8,
    cancelPendingTileRequestsWhileZooming: false,
    refreshExpiredTiles: false,
    transformRequest(
        url,
        resourceType
    ) {
                const isMartin =
            url.startsWith(
                MARTIN
            );
                const isMartinRaster =
            MARTIN_RASTER_SOURCES.some(
                path =>
                    url.includes(path)
            );
                if (
            isMartin &&
            !isMartinRaster &&
            resourceType === 'Tile' &&
            import.meta.env.VITE_USE_MLT === 'true'
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

const photorealisticInstaller = createPhotorealisticInstaller({
    map,
    getRepresentation,
    getActiveRepresentation,
    createLayer: createPhotorealisticTilesLayer,
    config: {
        initialRepresentation: INITIAL_REPRESENTATION,
        tilesUrl: PHOTOREALISTIC_TILES_URL,
        tilesOrigin: PHOTOREALISTIC_TILES_ORIGIN,
        errorTarget: PHOTOREALISTIC_TILES_ERROR_TARGET
    }
});

const installPhotorealisticTiles = photorealisticInstaller.installPhotorealisticTiles;

map.addControl(
    new maplibregl.NavigationControl(),
    'top-right'
);

setRepresentation(
    map,
    INITIAL_REPRESENTATION
);

map.on('style.load', installPhotorealisticTiles);
map.on('idle', installPhotorealisticTiles);

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
        addRepresentationSelect({
            getRepresentationIds,
            getActiveRepresentation,
            onChange: value => window.setRepresentation(value)
        });
        installPhotorealisticTiles();
    }
);

map.on(
    'error',
    (event) => {
        console.error(
            'MapLibre error:',
            event.error ?? event,
            {
                sourceId: event.sourceId,
                source: event.source,
                tile: event.tile,
                url: event.url
            }
        );
    }
);

window.map = map;

window.setRepresentation = (
    representation
) => {
    const result =
        setRepresentation(
            map,
            representation
        );
    installPhotorealisticTiles();
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

window.getPhotorealisticTilesDiagnostics =
    () => photorealisticInstaller.getLayer()?.getDiagnostics() ?? {
        enabled: false,
        configured: Boolean(PHOTOREALISTIC_TILES_URL),
        url: PHOTOREALISTIC_TILES_URL ?? null,
        reason: 'VITE_3D_TILES_URL is not configured'
    };

window.installPhotorealisticTiles =
    installPhotorealisticTiles;
