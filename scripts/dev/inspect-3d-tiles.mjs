#!/usr/bin/env node

const entry = process.argv[2];
if (!entry) {
    console.error('Usage: node scripts/dev/inspect-3d-tiles.mjs <tileset.json URL or path>');
    process.exit(2);
}

const seen = new Set();
const report = {
    tilesets: [],
    tiles: 0,
    contentUris: [],
    transforms: 0,
    boundingVolumes: {},
    geometricErrors: [],
    refines: {}
};

async function readJson(source) {
    if (/^https?:\/\//i.test(source)) {
        const response = await fetch(source);
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${source}`);
        return response.json();
    }

    const { readFile } = await import('node:fs/promises');
    return JSON.parse(await readFile(source, 'utf8'));
}

function resolveUri(base, uri) {
    if (/^https?:\/\//i.test(base)) return new URL(uri, base).href;
    return new URL(uri, `file://${base}`).pathname;
}

async function visit(source) {
    const identity = String(source);
    if (seen.has(identity)) return;
    seen.add(identity);
    const tileset = await readJson(source);
    if (!tileset.root || !tileset.asset) {
        throw new Error(`${source} is not a 3D Tiles tileset (expected asset and root)`);
    }
    const asset = tileset.asset ?? {};
    report.tilesets.push({
        source: identity,
        version: asset.version ?? null,
        tilesetVersion: asset.tilesetVersion ?? null,
        extensionsUsed: asset.extensionsUsed ?? [],
        extensionsRequired: asset.extensionsRequired ?? []
    });

    async function walk(tile, base) {
        if (!tile) return;
        report.tiles++;
        if (tile.transform) report.transforms++;
        const volume = tile.boundingVolume ?? {};
        for (const key of Object.keys(volume)) report.boundingVolumes[key] = (report.boundingVolumes[key] ?? 0) + 1;
        if (Number.isFinite(tile.geometricError)) report.geometricErrors.push(tile.geometricError);
        if (tile.refine) report.refines[tile.refine] = (report.refines[tile.refine] ?? 0) + 1;
        const uri = tile.content?.uri ?? tile.content?.url;
        if (uri) {
            const resolved = resolveUri(base, uri);
            report.contentUris.push(resolved);
            if (/\.json(?:$|\?)/i.test(resolved)) await visit(resolved);
        }
        for (const child of tile.children ?? []) await walk(child, base);
    }

    const base = source;
    await walk(tileset.root, base);
}

try {
    await visit(entry);
    console.log(JSON.stringify(report, null, 2));
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
