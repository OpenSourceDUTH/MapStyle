import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

import {
    requiredPoiIcons
} from '../src/icons/poi-icons.mjs';

import {
    poiCategories,
    poiColorByCategory
} from '../src/layers/poi/colors.mjs';


const ROOT = process.cwd();

const MAKI_DIRECTORY = path.join(
    ROOT,
    'node_modules/@mapbox/maki/icons'
);

const OUTPUT_DIRECTORY = path.join(
    ROOT,
    'public/sprites'
);


/*
 * Logical dimensions.
 *
 * These dimensions are independent of the @2x atlas.
 */
const MARKER_SIZE = 28;
const GLYPH_SIZE = 16;

const ATLAS_GAP = 2;
const COLUMNS = 16;


/*
 * Transit has its own visual identity.
 *
 * This is intentionally separate from the generic POI
 * category colours.
 */
const TRANSIT_COLOR = '#4f91c7';


function makeWhiteSvg(svg) {
    return svg
        .replace(
            /fill="(?!none)[^"]*"/gi,
            'fill="#ffffff"'
        )
        .replace(
            /fill='(?!none)[^']*'/gi,
            "fill='#ffffff'"
        )
        .replace(
            /stroke="(?!none)[^"]*"/gi,
            'stroke="#ffffff"'
        )
        .replace(
            /stroke='(?!none)[^']*'/gi,
            "stroke='#ffffff'"
        )
        .replace(
            /<svg\b/,
            '<svg fill="#ffffff"'
        );
}


async function renderGlyph(
    iconName,
    pixelRatio
) {
    const filename = path.join(
        MAKI_DIRECTORY,
        `${iconName}.svg`
    );

    const source = await fs.readFile(
        filename,
        'utf8'
    );

    const svg = makeWhiteSvg(source);

    const size =
        GLYPH_SIZE * pixelRatio;

    return sharp(
        Buffer.from(svg)
    )
        .resize(
            size,
            size,
            {
                fit: 'contain'
            }
        )
        .png()
        .toBuffer();
}


async function renderCircularMarker(
    iconName,
    color,
    pixelRatio
) {
    const markerSize =
        MARKER_SIZE * pixelRatio;

    const glyphSize =
        GLYPH_SIZE * pixelRatio;

    const glyphOffset = Math.round(
        (markerSize - glyphSize) / 2
    );


    const circleSvg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="${markerSize}"
            height="${markerSize}"
            viewBox="0 0 ${markerSize} ${markerSize}"
        >
            <circle
                cx="${markerSize / 2}"
                cy="${markerSize / 2}"
                r="${(markerSize / 2) - pixelRatio}"
                fill="${color}"
                stroke="#d8e4ec"
                stroke-width="${1.5 * pixelRatio}"
            />
        </svg>
    `;


    const circle = await sharp(
        Buffer.from(circleSvg)
    )
        .png()
        .toBuffer();


    const glyph = await renderGlyph(
        iconName,
        pixelRatio
    );


    return sharp(circle)
        .composite([
            {
                input: glyph,
                left: glyphOffset,
                top: glyphOffset
            }
        ])
        .png()
        .toBuffer();
}


/*
 * Build the list of images that belong in the atlas.
 *
 * Every item has:
 *
 * name  = MapLibre sprite name
 * icon  = Maki icon
 * color = marker background
 */
function getMarkerDefinitions() {
    const markers = [];


    /*
     * Generic POIs.
     */
    for (const category of poiCategories) {
        for (const icon of requiredPoiIcons) {
            markers.push({
                name: `${category}-${icon}`,
                icon,
                color:
                    poiColorByCategory[category]
            });
        }
    }


    /*
     * Transit infrastructure.
     *
     * We deliberately give this its own stable sprite name.
     * Future transit markers can be added here:
     *
     * transit-rail-station
     * transit-ferry-terminal
     * transit-tram-stop
     */
    markers.push({
        name: 'transit-bus-stop',
        icon: 'bus',
        color: TRANSIT_COLOR
    });


    return markers;
}


async function buildSprite(
    pixelRatio
) {
    const markers =
        getMarkerDefinitions();

    const markerSize =
        MARKER_SIZE * pixelRatio;

    const gap =
        ATLAS_GAP * pixelRatio;

    const cellSize =
        markerSize + gap;

    const rows = Math.ceil(
        markers.length / COLUMNS
    );

    const width =
        COLUMNS * cellSize;

    const height =
        rows * cellSize;


    const composites = [];
    const metadata = {};


    for (
        let index = 0;
        index < markers.length;
        index++
    ) {
        const marker =
            markers[index];

        const column =
            index % COLUMNS;

        const row =
            Math.floor(
                index / COLUMNS
            );

        const x =
            column * cellSize;

        const y =
            row * cellSize;


        const image =
            await renderCircularMarker(
                marker.icon,
                marker.color,
                pixelRatio
            );


        composites.push({
            input: image,
            left: x,
            top: y
        });


        metadata[marker.name] = {
            width: markerSize,
            height: markerSize,

            x,
            y,

            pixelRatio
        };
    }


    const suffix =
        pixelRatio === 1
            ? ''
            : '@2x';


    await sharp({
        create: {
            width,
            height,
            channels: 4,

            background: {
                r: 0,
                g: 0,
                b: 0,
                alpha: 0
            }
        }
    })
        .composite(composites)
        .png()
        .toFile(
            path.join(
                OUTPUT_DIRECTORY,
                `map${suffix}.png`
            )
        );


    await fs.writeFile(
        path.join(
            OUTPUT_DIRECTORY,
            `map${suffix}.json`
        ),

        JSON.stringify(
            metadata,
            null,
            2
        )
    );


    console.log(
        `Built map${suffix} with ${markers.length} markers.`
    );
}


await fs.mkdir(
    OUTPUT_DIRECTORY,
    {
        recursive: true
    }
);


await buildSprite(1);
await buildSprite(2);