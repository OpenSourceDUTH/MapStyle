export function createPinRenderer(
    sprite,
    baseIconSize
) {
    const pixelRatio = 2;
    const logicalSize = 72;
    const canvas = document.createElement('canvas');

    canvas.width = logicalSize * pixelRatio;
    canvas.height = logicalSize * pixelRatio;

    const context = canvas.getContext('2d');
    const spriteCanvas = document.createElement('canvas');
    const spriteData = sprite.data;

    spriteCanvas.width = spriteData.width;
    spriteCanvas.height = spriteData.height;
    spriteCanvas
        .getContext('2d')
        .putImageData(
            new ImageData(
                new Uint8ClampedArray(spriteData.data),
                spriteData.width,
                spriteData.height
            ),
            0,
            0
        );

    return {
        iconLogicalSize:
            spriteData.width /
            pixelRatio,

        render(animation) {
            context.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            const centre =
                logicalSize / 2;

            const iconWidth =
                spriteData.width *
                animation.scale *
                baseIconSize;

            const iconHeight =
                spriteData.height *
                animation.scale *
                baseIconSize;

            context.drawImage(
                spriteCanvas,
                (centre * pixelRatio - iconWidth / 2),
                (centre * pixelRatio - iconHeight / 2),
                iconWidth,
                iconHeight
            );

            const image =
                context.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

            return {
                width:
                    canvas.width,

                height:
                    canvas.height,

                data:
                    image.data
            };
        }
    };
}


