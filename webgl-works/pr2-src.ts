import { screenToGL, createRegularPolygon, generateRandomColor } from "./webgl-help/funcs";

// Константы из варианта
const globals = {
    maxTask: 8, // Сколько заданий всего
    n: 6, // Для потроения n-угольника
}

// Фигура 1
const figureVerts1 = screenToGL([
    [100, 200, 0],
    [100, 570, 0],
    [280, 570, 0],
    [200, 470, 0],
    [370, 240, 0],
    [500, 420, 0],
    [370, 570, 0],
    [700, 570, 0],
], [800, 800]);

// Фигура 2
const figureVerts2 = screenToGL([
    [320, 330, 0],
    [400, 600, 0],
    [130, 510, 0],
    [90, 290, 0],
    [220, 150, 0],
    [410, 240, 0],
    [690, 150, 0],
    [690, 330, 0],
], [800, 800]);

// Фигура 3
const figureVerts3 = screenToGL([
    [377, 630, 0],
    [83, 630, 0],
    [179, 533, 0],
    [83, 240, 0],
    [372, 385, 0],
    [328, 291, 0],
    [471, 385, 0],
    [665, 145, 0],
    [471, 630, 0],
    [717, 630, 0],
], [800, 800]);

// Вершинный шейдер
const vsSource = `#version 300 es
    in vec4 aVertexPosition;
    in vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uTransformMatrix;
    uniform float uPointSize;

    flat out vec4 vColor;

    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * uTransformMatrix  * aVertexPosition;
        gl_PointSize = uPointSize;
        vColor = aVertexColor;
    }
`;

// Фрагментный шейдер для точки
const fsSourceRedPoint = `#version 300 es
precision mediump float;
out vec4 fragColor;

void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    if(length(coord) > 0.5) discard;
    fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`;

// Фрагментный шейдер красный
const fsSourceRed = `#version 300 es
precision mediump float;
out vec4 fragColor;

void main() {
    fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`;

// Фрагментный шейдер с поддержкой цвета
const fsSourceColor = `#version 300 es
    precision highp float;

    flat in vec4 vColor;
    out vec4 fragColor;

    void main() {
        fragColor = vColor;
    }
`;

export {
    globals,
    fsSourceRedPoint,
    fsSourceRed,
    vsSource,
    fsSourceColor,
    figureVerts1,
    figureVerts2,
    figureVerts3,
    createRegularPolygon,
    generateRandomColor,
}