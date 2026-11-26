import {spawn} from 'node:child_process';
import {mkdir, mkdtemp, rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const databaseDir = fileURLToPath(new URL('../../database/', import.meta.url));
const databaseUrl = process.env.DATABASE_URL;
const stage = 'mapstyle_osm_stage';

if (!databaseUrl) throw new Error('DATABASE_URL is required');

function run(command, args, env = process.env) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {env, stdio: 'inherit'});
        child.once('error', reject);
        child.once('close', (code, signal) => {
            if (code === 0) resolve();
            else reject(new Error(`${command} failed (${signal ?? code})`));
        });
    });
}

const psql = (...args) => run('psql', ['-X', '-d', databaseUrl, '-v', 'ON_ERROR_STOP=1', ...args]);

async function downloadExtract(workDir) {
    const bbox = process.env.OSM_BBOX ?? '24.20,40.80,24.60,41.10';
    const sourceUrl = process.env.OSM_SOURCE_URL ?? 'https://download.geofabrik.de/europe/greece/greece-latest.osm.pbf';
    const greece = path.join(workDir, 'greece-latest.osm.pbf');
    const kavala = path.join(workDir, 'kavala.osm.pbf');
    await run('curl', ['--fail', '--location', '--retry', '3', '--output', greece, sourceUrl]);
    await run('osmium', ['extract', '--bbox', bbox, '--strategy', 'smart', '--overwrite', greece, '-o', kavala]);
    return kavala;
}

// The staging schema is held from download through promotion so a second
// process targeting the same database cannot start an overlapping import.
await psql('-c', `CREATE SCHEMA ${stage}`);
let tempDir;
try {
    let extract = process.env.OSM_PBF;
    if (!extract) {
        const workDir = path.resolve(process.env.OSM_WORK_DIR ?? '.osm-cache');
        await mkdir(workDir, {recursive: true});
        tempDir = await mkdtemp(path.join(workDir, 'import-'));
        extract = await downloadExtract(tempDir);
    }
    await run('osm2pgsql', [
        '--create', '--slim', '--drop', '--output', 'flex', '--schema', stage,
        '--style', path.join(databaseDir, 'import/osm-flex.lua'), '--database', databaseUrl, path.resolve(extract)
    ], {...process.env, MAPSTYLE_OSM_SCHEMA: stage});
    await psql('-f', path.join(databaseDir, 'import/promote-refresh.sql'));
} finally {
    await psql('-c', `DROP SCHEMA ${stage} CASCADE`);
    if (tempDir) await rm(tempDir, {recursive: true, force: true});
}
console.log('OSM refresh complete');
