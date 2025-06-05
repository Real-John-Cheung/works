// from hanzi-writer https://github.com/chanind/hanzi-writer/blob/master/src/Positioner.ts#L21 
const from = { x: 0, y: - 124 };
const to = { x: 1024, y: 900 };
const W = 1024, H = 1024
function getTransform(w, h, padding = 0) {
    const effectiveWidth = w - 2 * padding;
    const effectiveHeight = h - 2 * padding;
    const scaleX = effectiveWidth / W;
    const scaleY = effectiveHeight / H;
    const scale = Math.min(scaleX, scaleY);
    const xCenteringBuffer = padding + (effectiveWidth - scale * W) / 2;
    const yCenteringBuffer = padding + (effectiveHeight - scale * H) / 2;
    const xOffset = -1 * from.x * scale + xCenteringBuffer;
    const yOffset = -1 * from.y * scale + yCenteringBuffer;
    return {
        translate: { x: xOffset, y: h - yOffset },
        scale: { x: scale, y: -1 * scale },
    }
}
centroid = function (vertices) {
    let x = 0, y = 0;
    for (const p of vertices) {
        x += p.x;
        y += p.y;
    }
    return {
        x: x / vertices.length,
        y: y / vertices.length,
    };
}