const globals = {
    maxTask: 3, // Сколько заданий всего
    n: 6, // Для потроения n-угольника
}

// Функция для создания правильного n-угольника
function createRegularPolygon(n: number, radius: number = 0.7) {
    const vertices = [] as number[][];

    for (let i = 0; i < n; i++) {
        const angle = (2 * Math.PI * i) / n;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        vertices.push([x, y, 0]); // x, y, z
    }

    return vertices;
}

// Фрагментный шейдер
const fsSourceRedPoint = `#version 300 es
precision mediump float;
out vec4 fragColor;

void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    if(length(coord) > 0.5) discard;
    fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`;

const fsSourceRed = `#version 300 es
precision mediump float;
out vec4 fragColor;

void main() {
    fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`;

// Вершинный шейдер
const vsSource = `#version 300 es
    in vec4 aVertexPosition;
    in vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform float uPointSize;

    flat out vec4 vColor;

    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        gl_PointSize = uPointSize;
        vColor = aVertexColor;
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

export{
    globals,
    createRegularPolygon,
    fsSourceColor,
    fsSourceRed,
    fsSourceRedPoint,
    vsSource,
}