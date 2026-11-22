import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';

const exec = promisify(execFile);
const output = path.resolve(process.argv[2] ?? 'output');
const lodArgument = process.argv[3] ?? 'lod1';
// A relative LOD directory belongs beside the source tiles under `output`.
// Resolving it from the process cwd writes a sibling directory that the
// tileset's relative content URIs cannot reach.
const lod = path.isAbsolute(lodArgument)
    ? path.resolve(lodArgument)
    : path.resolve(output, lodArgument);
// Ten percent leaves recognizable silhouettes but throws away too much
// structure for an oblique map view. Keep the coarse branch around one third
// of the source triangles unless a deployment explicitly supplies a ratio.
const ratio = Number(process.argv[4] ?? 0.35);

const readTileDocument = async filename => {
    const data = await fs.readFile(filename);
    if (path.extname(filename) === '.gltf') return JSON.parse(data);
    if (data.toString('ascii', 0, 4) !== 'glTF') throw new Error(`Invalid GLB: ${filename}`);
    const jsonLength = data.readUInt32LE(12);
    return JSON.parse(data.toString('utf8', 20, 20 + jsonLength).replace(/[\u0000\u0020]+$/, ''));
};

await fs.mkdir(lod, { recursive: true });
const outputNames = await fs.readdir(output);
const names = outputNames
    .filter(name => /^tile_\d+_\d+\.gltf$/.test(name))
    .sort();
for (const name of outputNames
    .filter(candidate => /^tile_\d+_\d+\.glb$/.test(candidate))
    .sort()) {
    // A textured glTF companion is preferred when it exists. It has the same
    // geometry and UVs as the GLB but preserves the shared baseColor image.
    const texturedName = name.replace(/\.glb$/, '.gltf');
    if (!names.includes(texturedName)) names.push(name);
}
if (!names.length) throw new Error(`No tile GLBs or glTFs found in ${output}`);

const sourceFor = name => path.join(output, name);
const coarseNameFor = name => name;
const sourceUsesExternalTexture = names.some(name => name.endsWith('.gltf'));
if (sourceUsesExternalTexture) {
    try {
        await fs.copyFile(path.join(output, 'baseColor.jpg'), path.join(lod, 'baseColor.jpg'));
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
}

for (let i = 0; i < names.length; i++) {
    const input = sourceFor(names[i]);
    const target = path.join(lod, coarseNameFor(names[i]));
    try {
        await fs.access(target);
    } catch {
        await exec('gltf-transform', ['simplify', input, target, '--ratio', String(ratio), '--error', '1']);
        // Very small edge tiles can simplify to an empty scene. Keep their
        // original geometry so the coarse branch never creates a hole.
        const coarse = await readTileDocument(target);
        if (!coarse.meshes?.length) await fs.copyFile(input, target);
    }
    // A fallback copy of a glTF keeps its relative .bin/image URIs. Make
    // those resources available beside the coarse document as well; normal
    // gltf-transform output already writes them there, so this is a no-op.
    if (names[i].endsWith('.gltf')) {
        const coarse = await readTileDocument(target);
        for (const resource of [...(coarse.buffers ?? []), ...(coarse.images ?? [])]) {
            const uri = resource.uri;
            if (!uri || uri.startsWith('data:')) continue;
            const destination = path.join(lod, uri);
            try {
                await fs.access(destination);
            } catch (error) {
                if (error.code !== 'ENOENT') throw error;
                await fs.copyFile(path.join(output, uri), destination);
            }
        }
    }
    console.log(`[${i + 1}/${names.length}] ${names[i]}`);
}

const bounds = doc => {
    const primitive = doc.meshes?.[0]?.primitives?.[0];
    if (!primitive) return null;
    const accessor = doc.accessors[primitive.attributes.POSITION];
    return [accessor.min, accessor.max];
};
const box = ([min, max]) => {
    const center = min.map((v, i) => (v + max[i]) / 2);
    const half = min.map((v, i) => (max[i] - v) / 2);
    return [...center, half[0], 0, 0, 0, half[1], 0, 0, 0, half[2]];
};
const diagonal = ([min, max]) => Math.hypot(...min.map((v, i) => max[i] - v));

const children = [];
const lodUriPrefix = path.relative(output, lod).split(path.sep).join('/');
const globalMin = [Infinity, Infinity, Infinity];
const globalMax = [-Infinity, -Infinity, -Infinity];
for (const name of names) {
    const original = bounds(await readTileDocument(path.join(output, name)));
    const coarse = bounds(await readTileDocument(path.join(lod, name))) ?? original;
    for (let i = 0; i < 3; i++) {
        globalMin[i] = Math.min(globalMin[i], original[0][i]);
        globalMax[i] = Math.max(globalMax[i], original[1][i]);
    }
    children.push({
        boundingVolume: { box: box(original) },
        geometricError: Math.max(1, diagonal(coarse)),
        refine: 'REPLACE',
        content: { uri: `${lodUriPrefix ? `${lodUriPrefix}/` : ''}${name}` },
        children: [{
            boundingVolume: { box: box(original) },
            geometricError: 0,
            content: { uri: name }
        }]
    });
}

const rootBounds = [globalMin, globalMax];
const rootError = diagonal(rootBounds);
await fs.writeFile(path.join(output, 'tileset.json'), JSON.stringify({
    asset: { version: '1.1', gltfUpAxis: 'z', generator: 'MapStyle build-lod.mjs' },
    geometricError: rootError,
    root: {
        boundingVolume: { box: box(rootBounds) },
        geometricError: rootError,
        refine: 'REPLACE',
        children
    }
}, null, 2) + '\n');
console.log(`Wrote ${path.join(output, 'tileset.json')} with ${children.length} dynamic LOD branches.`);
