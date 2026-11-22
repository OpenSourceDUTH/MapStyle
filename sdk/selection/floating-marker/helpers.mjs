function collectCoordinates(coordinates, output) {
    if (Array.isArray(coordinates) && coordinates.length >= 2 && typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
        output.push([coordinates[0], coordinates[1]]);
        return;
    }
    if (Array.isArray(coordinates)) for (const child of coordinates) collectCoordinates(child, output);
}

export function pointCoordinate(feature) {
    const geometry = feature?.geometry;
    if (!geometry) return null;
    if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) return geometry.coordinates.slice(0, 2);
    const points = [];
    collectCoordinates(geometry.coordinates, points);
    if (!points.length) return null;
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
}

export function sanitizeValue(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'bigint') {
        const number = Number(value);
        return Number.isSafeInteger(number) ? number : value.toString();
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.map(sanitizeValue);
    if (typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, sanitizeValue(child)]));
    return String(value);
}

export const safeStyleValue = sanitizeValue;

function scaleZoomExpression(expression, scale, step) {
    const result = structuredClone(expression);
    const start = step ? 2 : 4;
    if (step && typeof result[2] === 'number') result[2] *= scale;
    for (let i = start; i < result.length; i += 2) if (typeof result[i] === 'number') result[i] *= scale;
    return result;
}

export function scaledIconSize(base, scale) {
    if (typeof base === 'number' || !Array.isArray(base)) return typeof base === 'number' ? base * scale : base;
    if (base[0] === 'interpolate' && Array.isArray(base[2]) && base[2][0] === 'zoom') return scaleZoomExpression(base, scale, false);
    if (base[0] === 'step' && Array.isArray(base[1]) && base[1][0] === 'zoom') return scaleZoomExpression(base, scale, true);
    return base;
}

export function ids(key) {
    const prefix = `floating-${key}`;
    return {
        pointSource: `${prefix}-point-source`,
        shapeSource: `${prefix}-shape-source`,
        shape: `${prefix}-shape`,
        shapeOutline: `${prefix}-shape-outline`,
        anchorRing: `${prefix}-anchor-ring`,
        anchor: `${prefix}-anchor`,
        marker: `${prefix}-marker`,
        label: `${prefix}-label`,
        image: `${prefix}-image`
    };
}
