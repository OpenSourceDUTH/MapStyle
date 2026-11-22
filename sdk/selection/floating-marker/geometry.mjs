export function pinScreenPolygon(centreX, centreY, radius, tailLength) {
    const points = [];
    const startDegrees = 40;
    const endDegrees = -220;
    const steps = 30;

    for (let i = 0; i <= steps; i++) {
        const degrees =
            startDegrees +
            (endDegrees - startDegrees) * (i / steps);
        const angle = degrees * Math.PI / 180;
        points.push([
            centreX + Math.cos(angle) * radius,
            centreY + Math.sin(angle) * radius
        ]);
    }

    const lowerPoint = (x, y) => points.push([
        centreX + x,
        centreY + y
    ]);

    lowerPoint(-radius * 0.42, radius * 0.78);
    lowerPoint(-radius * 0.20, radius + tailLength * 0.35);
    lowerPoint(-2.2, radius + tailLength * 0.88);
    lowerPoint(0, radius + tailLength);
    lowerPoint(2.2, radius + tailLength * 0.88);
    lowerPoint(radius * 0.20, radius + tailLength * 0.35);
    lowerPoint(radius * 0.42, radius * 0.78);
    points.push(points[0]);

    return points;
}
