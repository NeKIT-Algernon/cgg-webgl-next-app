// Практическая работа № 1. Создание оконного приложения.
//
// С использованием шейдерных программ отобразить на окне три 
// треугольника разных цветов. Для каждого треугольника следует создать свой 
// фрагментный шейдер, определяющий его цвет. 

import { initShaderProgram } from "./webgl-help/initShaders";
import { initBuffers } from "./webgl-help/initBuffers";
import { renderAll } from "./webgl-help/draw";

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
    -0.9, -0.5, 0.0,
    -0.6, 0.5, 0.0,
    -0.3, -0.5, 0.0
]
const positionsTri2 = [
    -0.3, -0.5, 0.0,
    0.0, 0.5, 0.0,
    0.3, -0.5, 0.0,
]
 const positionsTri3 = [   
    0.3, -0.5, 0.0,
    0.6, 0.5, 0.0,
    0.9, -0.5, 0.0,
];

export const PR1: WebGLWork = {
    id: "1",
    name: "Практическая работа № 1. Создание оконного приложения",
    controls: [],
    async initialize(gl, customSettings: WebGLcustomSettings) {

        // Инициализация шейдерных программ
        const shaderProgramTri1 = initShaderProgram(gl, vsSource, fsSourcetri1);
        const shaderProgramTri2 = initShaderProgram(gl, vsSource, fsSourcetri2);
        const shaderProgramTri3 = initShaderProgram(gl, vsSource, fsSourcetri3);
        if (!shaderProgramTri1 || !shaderProgramTri2 || !shaderProgramTri3){
            alert(`Initializing shader program is failed`);
            return null;
        }
        const shaders = [shaderProgramTri1, shaderProgramTri2, shaderProgramTri3];

        // Инициализация буферов
        const buffersTri1 = initBuffers(gl, positionsTri1);
        const buffersTri2 = initBuffers(gl, positionsTri2);
        const buffersTri3 = initBuffers(gl, positionsTri3);
        if (!buffersTri1 || !buffersTri2 || !buffersTri3){
            alert(`Initializing buffers is failed`);
            return null;
        }
        const buffers = [buffersTri1, buffersTri2, buffersTri3]

        // Заготовка для рендера фигур
        const renderProgram = {
            programInfoList: [] as WebGLProgramInfo[],
            buffersList: buffers,
        }

        // Добавляем в цикле ProgramInfo для каждой шейдерной программы
        for (let i = 0; i < shaders.length; i++){
            renderProgram.programInfoList.push({
                program: shaders[i],
                vertexCount: 3,
                attribLocations: {
                    vertexPosition: gl.getAttribLocation(shaders[i], "aVertexPosition"),
                    vertexColor: gl.getAttribLocation(shaders[i], "aVertexColor"),
            },
                uniformLocations: {
                    projectionMatrix: gl.getUniformLocation(shaders[i], "uProjectionMatrix"),
                    modelViewMatrix: gl.getUniformLocation(shaders[i], "uModelViewMatrix"),
            },
        })
        }

        // Выполняем рендер
        renderAll(gl, renderProgram);
        return;
    },
}