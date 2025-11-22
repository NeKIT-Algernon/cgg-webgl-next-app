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

// Фрагментные шейдеры для 3-х треугольников по заданию
const fsSourcetri1 = `#version 300 es
precision mediump float;
out vec4 fragColor;

void main() {
    fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`;
const fsSourcetri2 = `#version 300 es
precision mediump float;
out vec4 fragColor;

void main() {
    fragColor = vec4(0.0, 1.0, 0.0, 1.0);
}
`;
const fsSourcetri3 = `#version 300 es
precision mediump float;
out vec4 fragColor;

void main() {
    fragColor = vec4(0.0, 0.0, 1.0, 0.2);
}
`;

// Координаты для вершин 3-х треугольников
const positionsTri1 = [
    [-0.9, -0.5, 0.0],
    [-0.6, 0.5, 0.0],
    [-0.3, -0.5, 0.0],
]
const positionsTri2 = [
    [-0.3, -0.5, 0.0],
    [0.0, 0.5, 0.0],
    [0.3, -0.5, 0.0],
]
 const positionsTri3 = [   
    [0.3, -0.5, 0.0],
    [0.6, 0.5, 0.0],
    [0.9, -0.5, 0.0],
];

export {
    vsSource,
    fsSourcetri1,
    fsSourcetri2,
    fsSourcetri3,
    positionsTri1,
    positionsTri2,
    positionsTri3,
}