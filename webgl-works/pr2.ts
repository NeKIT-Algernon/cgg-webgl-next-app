import { initShaderProgram } from "./webgl-help/initShaders";
import { initBuffers } from "./webgl-help/initBuffers";
import { renderAll } from "./webgl-help/draw";

const globals = {
    maxTask: 8, // Сколько заданий всего
    n: 6, // Для потроения n-угольника
    verts: [0],
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
    keyHandler: (event: KeyboardEvent, settings: WebGLcustomSettings) => {
        console.log(`Point size = ${settings.pointSize}`);
        switch(event.code){
            case 'KeyP':
                console.log(`Point size = ${settings.pointSize}`);
                if (settings.pointSize) settings.pointSize = Math.min(settings.pointSize + 1.0, 100.0);
                console.log(`Point size = ${settings.pointSize}`);
                break;
            case 'KeyO':
                if (settings.pointSize) settings.pointSize = Math.max(settings.pointSize - 1.0, 1);
                console.log(`Point size = ${settings.pointSize}`);
                break;
        }
    },
    async initialize(gl, customSettings: WebGLcustomSettings) {
        switch (customSettings.currentTask) {
            case 1:
                customSettings.primitive = 0;
                console.log(`1curTask = ${customSettings.currentTask}`);
                globals.verts = createRegularPolygon(globals.n, 0.5);
                break;
        }
        const shaderProgram = initShaderProgram(gl, vsSource, fsSourceRed);
        if (!shaderProgram) {
            alert(`Initializing shader program is failed`);
            return null;
        }
        console.log(`2curTask = ${customSettings.currentTask}`);
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

