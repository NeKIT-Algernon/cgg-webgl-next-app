// Вершинный шейдер
const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
`;

// Фрагментные шейдеры для 3-х треугольников по заданию
const fsSourcetri1 = `
    void main() {
      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
  `;
const fsSourcetri2 = `
    void main() {
      gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
    }
  `;
const fsSourcetri3 = `
    void main() {
      gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
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