import { initShaderProgram } from "./webgl-help/initShaders";
import { initBuffers } from "./webgl-help/initBuffers";
import { renderAll } from "./webgl-help/draw";

const globals = {
    currentTask: 1, // Для отслеживания текущего задания
    maxTask: 8, // Сколько заданий всего
    n: 6, // Для потроения n-угольника
    verts: [0],
}

const customSettings = {
    pointSize: 10.0, // Для задания 1
    primitive: 0, // Для задания 5
}

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

export const PR2: WebGLWork = {
    id: "2",
    name: "Практическая работа № 2. Примитивы",
    controls: [
        "1...8 или left / right - Переключение по заданиям ",
        "",
    ],
    async initialize(gl, taskNum?: number) {
        switch (globals.currentTask) {
            case 1:
                globals.verts = createRegularPolygon(globals.n, 0.5);
                break;
        }
        const shaderProgram = initShaderProgram(gl, vsSource, fsSourceRed);
        if (!shaderProgram) {
            alert(`Initializing shader program is failed`);
            return null;
        }

        const buffer = initBuffers(gl, globals.verts);
        if (!buffer) {
            alert(`Initializing buffers is failed`);
            return null;
        }

        const renderProgram = {
            programInfoList: [] as WebGLProgramInfo[],
            buffersList: [buffer],
        }

        renderProgram.programInfoList.push({
            program: shaderProgram,
            vertexCount: globals.n,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
                vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
                modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
                pointSize: gl.getUniformLocation(shaderProgram, "uPointSize"),
            },
        })

        renderAll(gl, renderProgram, customSettings)

        return;
    }
}

