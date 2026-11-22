import fs from 'node:fs/promises';
import path from 'node:path';
import {createStyle} from '../../src/style.mjs';

const output = process.argv[2] ?? 'dist/map-style.json';
const representation = process.argv[3] ?? '2d';
const martinUrl = process.env.MAPSTYLE_MARTIN_URL?.replace(/\/+$/, '');
const style = createStyle(representation, {
    martinUrl,
    sprite: `${martinUrl ?? ''}/sprite/sprites`,
    glyphs: `${martinUrl ?? ''}/font/{fontstack}/{range}`
});
const outputPath = path.resolve(output);
await fs.mkdir(path.dirname(outputPath), {recursive: true});
await fs.writeFile(outputPath, `${JSON.stringify(style, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
