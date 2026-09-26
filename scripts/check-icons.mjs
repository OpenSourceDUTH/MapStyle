import fs from 'node:fs';
import path from 'node:path';

import {
    requiredPoiIcons
} from '../src/icons/poi-icons.mjs';


const makiDirectory = path.resolve(
    'node_modules/@mapbox/maki/icons'
);

let missing = 0;

for (const icon of requiredPoiIcons) {
    const filename = path.join(
        makiDirectory,
        `${icon}.svg`
    );

    if (!fs.existsSync(filename)) {
        console.error(
            `Missing Maki icon: ${icon}`
        );

        missing++;
    }
}

if (missing > 0) {
    console.error(
        `\n${missing} icon mapping(s) need correction.`
    );

    process.exit(1);
}

console.log(
    `${requiredPoiIcons.length} icons found.`
);
