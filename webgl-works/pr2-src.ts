// Глобальные константы
const globals = {
    maxTask: 8, // Сколько заданий всего
    n: 6, // Для потроения n-угольника
}

// Функция для создания правильного n-угольника
function createRegularPolygon(n: number, radius: number = 1): number[] {
    const vertices: number[] = [];

    for (let i = 0; i < n; i++) {
        const angle = (2 * Math.PI * i) / n;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        vertices.push(x, y, 0); // x, y, z
    }

    return vertices;
}

// Фрагментный шейдер
const fsSourceRed = `
    precision mediump float;
    void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    if(length(coord) > 0.5) {
        discard;
    }
      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
  `;

// Вершинный шейдер
const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    uniform float uPointSize;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      gl_PointSize = uPointSize;
      vColor = aVertexColor;
    }
`;

export {globals, createRegularPolygon, fsSourceRed, vsSource}