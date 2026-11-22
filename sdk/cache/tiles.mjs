// Increment the version when published imagery or vector data changes.
const CACHE_NAME = 'mapstyle-tiles-v1';
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const MEMORY_BYTES = 32 * 1024 * 1024;
const DISK_ENTRIES = 512;

export function createTileCache({fetchTile = fetch, storage = globalThis.caches} = {}) {
    const memory = new Map();
    const pending = new Map();
    let bytes = 0;
    let writes = Promise.resolve();
    const disk = storage?.open(CACHE_NAME).catch(() => null) ?? Promise.resolve(null);
    function remember(key, data) {
        if (memory.has(key)) bytes -= memory.get(key).data.byteLength;
        memory.delete(key);
        memory.set(key, {data, time: Date.now()});
        bytes += data.byteLength;
        while (bytes > MEMORY_BYTES) {
            const oldest = memory.keys().next().value;
            bytes -= memory.get(oldest).data.byteLength;
            memory.delete(oldest);
        }
    }
    async function load(url, headers) {
        const key = `${url}${url.includes('?') ? '&' : '?'}_mapstyle_format=${encodeURIComponent(headers?.Accept ?? 'image')}`;
        const cached = memory.get(key);
        if (cached && Date.now() - cached.time < MAX_AGE) {
            memory.delete(key);
            memory.set(key, cached);
            return cached.data.slice(0);
        }
        if (!pending.has(key)) {
            const request = (async () => {
                const cache = await disk;
                const hit = await cache?.match(key).catch(() => null);
                if (hit && Date.now() - Number(hit.headers.get('x-mapstyle-time')) < MAX_AGE) {
                    const data = await hit.arrayBuffer();
                    remember(key, data);
                    return data;
                }
                let response;
                try {
                    response = await fetchTile(url, {headers});
                } catch (error) {
                    console.error('[Tile cache] fetch failed', {url, headers, error: String(error)});
                    throw error;
                }
                if (!response.ok) throw new Error(`Tile request failed (${response.status}): ${url}`);
                const data = await response.arrayBuffer();
                remember(key, data);
                // Storage failure must never prevent a tile from rendering.
                if (cache) writes = writes.then(async () => {
                    await cache.delete(key);
                    await cache.put(key, new Response(data.slice(0), {headers: {'x-mapstyle-time': String(Date.now())}}));
                    const keys = await cache.keys();
                    for (const entry of keys.slice(0, Math.max(0, keys.length - DISK_ENTRIES))) await cache.delete(entry);
                }).catch(() => {});
                return data;
            })();
            pending.set(key, request);
            request.finally(() => pending.delete(key)).catch(() => {});
        }
        // MapLibre workers may transfer (detach) the returned buffer.
        return (await pending.get(key)).slice(0);
    }
    return {load};
}

export function installTileCache(maplibregl) {
    const cache = createTileCache();
    maplibregl.addProtocol('mapstyle-cache', async (params, controller) => {
        if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
        // Shared requests finish even if a camera movement cancels one consumer.
        const data = await cache.load(params.url.slice('mapstyle-cache://'.length), params.headers);
        if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
        return {data};
    });
    return cache;
}

export function tileCoordinate(lng, lat, zoom) {
    const count = 2 ** zoom;
    const latitude = Math.max(-85.05112878, Math.min(85.05112878, lat)) * Math.PI / 180;
    return [Math.floor((lng + 180) / 360 * count), Math.floor((1 - Math.asinh(Math.tan(latitude)) / Math.PI) / 2 * count)];
}

// Warm adjacent imagery and coarser zooms after visible tiles have loaded.
// Two background requests at a time leave bandwidth for the current view.
export function prefetchAerial(map, cache) {
    let generation = 0;
    let running = false;
    async function warm() {
        const current = ++generation;
        if (running || map.isMoving() || !map.areTilesLoaded()) return;
        const source = map.getSource('campus-aerial');
        if (!source?.tiles?.length) return;
        running = true;
        try {
            const bounds = map.getBounds();
            const region = source.bounds;
            const max = Math.min(source.maxzoom, Math.max(source.minzoom, Math.floor(map.getZoom())));
            const queue = [];
            const seen = new Set();
            for (const z of [max - 2, max - 1, max, max + 1]) {
                if (z < source.minzoom || z > source.maxzoom) continue;
                const [west, north] = tileCoordinate(bounds.getWest(), bounds.getNorth(), z);
                const [east, south] = tileCoordinate(bounds.getEast(), bounds.getSouth(), z);
                const [minX, minY] = region ? tileCoordinate(region[0], region[3], z) : [0, 0];
                const [maxX, maxY] = region ? tileCoordinate(region[2], region[1], z) : [2 ** z - 1, 2 ** z - 1];
                for (let x = Math.max(west - 1, minX); x <= Math.min(east + 1, maxX); x++) {
                    for (let y = Math.max(north - 1, minY); y <= Math.min(south + 1, maxY); y++) {
                        const url = source.tiles[0].replace('{z}', z).replace('{x}', x).replace('{y}', y);
                        if (!seen.has(url) && queue.length < 96) { seen.add(url); queue.push(url); }
                    }
                }
            }
            await Promise.all([0, 1].map(async () => {
                while (queue.length && current === generation && !map.isMoving()) {
                    await cache.load(queue.shift()).catch(() => {});
                }
            }));
        } finally { running = false; }
    }
    const cancel = () => { generation++; };
    map.on('movestart', cancel);
    map.on('idle', warm);
    map.on('remove', () => { cancel(); map.off('idle', warm); map.off('movestart', cancel); });
}
