const globals = {
    maxTask: 3, // Сколько заданий всего
    n: 6, // Для потроения n-угольника
    kx: -0.5, ky: 1.5,
    px: 1, py: -0.5,
    a: Math.PI / 4,
    x: -10, y: 3,
    b: -Math.PI / 6,
}

const square = screenToGL([
    [100, 350, 0],
    [300, 350, 0],
    [300, 550, 0],
    [100, 550, 0],
], [800, 800])

const triangle = screenToGL([
    [400, 600, 0],
    [600, 600, 0],
    [500, 400, 0],
], [800, 800])

const line = screenToGL([
    [200, 200, 0],
    [500, 300, 0],
], [800, 800])

const butterflyTriangle = screenToGL([
    [50, 400, 0],
    [50, 200, 0],
    [400, 400, 0],
], [800, 800])

// Функция преобразования из системы координат экрана (0,0 в левом верхнем углу)
// в систему координат OpenGL (-1,-1 в левом нижнем углу, 1,1 в правом верхнем).
// Первым аргументом передаём массив массивов из точек (3 значения на точку), а вторым размеры в системе координат экрана
function screenToGL(array: number[][], [X, Y]: [number, number]) {
    return array.map((point) => {
        return point.map((coord, i) => {
            if (i % 3 == 0) return (2 * coord / X) - 1;
            if (i % 3 == 1) return 1 - (2 * coord / Y);
            return 0;
        })
    });
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
const fsSourceRed = `#version 300 es
precision mediump float;
out vec4 fragColor;

void main() {
    fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`;
const fsSourceGreen = `#version 300 es
precision mediump float;
out vec4 fragColor;

void main() {
    fragColor = vec4(0.0, 1.0, 0.0, 1.0);
}
`;
const fsSourceBlue = `#version 300 es
precision mediump float;
out vec4 fragColor;

void main() {
    fragColor = vec4(0.0, 0.0, 1.0, 0.2);
}
`;

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
    fsSourceGreen,
    fsSourceBlue,
    vsSource,
    square,
    triangle,
    line,
    butterflyTriangle,
}