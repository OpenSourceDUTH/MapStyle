import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTileCache, tileCoordinate} from '../sdk/cache/tiles.mjs';

test('concurrent requests share a fetch and return independent transferable buffers', async () => {
    let requests = 0;
    const cache = createTileCache({storage: null, fetchTile: async () => {
        requests++;
        return new Response(new Uint8Array([1, 2, 3]));
    }});
    const [first, second] = await Promise.all([cache.load('https://tiles.test/1'), cache.load('https://tiles.test/1')]);
    assert.equal(requests, 1);
    structuredClone(first, {transfer: [first]});
    assert.deepEqual([...new Uint8Array(second)], [1, 2, 3]);
    assert.deepEqual([...new Uint8Array(await cache.load('https://tiles.test/1'))], [1, 2, 3]);
    assert.equal(requests, 1);
});

test('failed requests can be retried and formats have separate cache keys', async () => {
    let requests = 0;
    const cache = createTileCache({storage: null, fetchTile: async () => new Response('tile', {status: ++requests === 1 ? 503 : 200})});
    await assert.rejects(cache.load('https://tiles.test/1'), /503/);
    await cache.load('https://tiles.test/1');
    await cache.load('https://tiles.test/1', {Accept: 'application/vnd.maplibre-tile'});
    assert.equal(requests, 3);
});

test('persistent hits survive a new cache instance; denied storage falls back to network', async () => {
    const storage = {open: async () => ({match: async () => new Response('saved', {headers: {'x-mapstyle-time': String(Date.now())}})})};
    const cache = createTileCache({storage, fetchTile: () => {throw new Error('unexpected network');}});
    assert.equal(new TextDecoder().decode(await cache.load('https://tiles.test/1')), 'saved');
    const fallback = createTileCache({storage: {open: async () => {throw new Error('denied');}}, fetchTile: async () => new Response('network')});
    assert.equal(new TextDecoder().decode(await fallback.load('https://tiles.test/1')), 'network');
});

test('tile coordinates locate the campus and clamp polar latitudes', () => {
    assert.deepEqual(tileCoordinate(0, 0, 2), [2, 2]);
    assert.equal(tileCoordinate(24.38, 40.93, 14)[0], 9301);
    assert.ok(Number.isFinite(tileCoordinate(0, 90, 14)[1]));
});
