import { mat3, mat4 } from "gl-matrix";
import { WebGLProgramInfoType, WebGLSceneOptionsType, WorkType } from "@/types/webGLWork";
import { initShaderProgram } from "./webgl-help/initShaders";
import { initBuffers } from "./webgl-help/initBuffers";
import { renderAll } from "./webgl-help/draw";
import { Mesh } from "webgl-obj-loader";
import { fsSourceRed, vsSource } from "./pr5-src";
import { cart } from "./cart";
import { globals, createSphere, setupModelBuffers, createShaderProgram, renderModel } from "./pr6-src";

let model;
let program: WebGLProgram;
let buffers: {
    vertexBuffer: WebGLBuffer;
    normalBuffer: WebGLBuffer | null;
    indexBuffer: WebGLBuffer;
    vertexCount: number;
};

let xAngle = 0;

let yOption = 0.3;
let zOption = -7;
let xOption = 0;

export const PR6: WorkType = {
    id: "6",
    name: "Практика № 6",
    controls: [
        "Z/X - вращение вокруг OY",
        "C/V - вращение вокруг OX",
        "WASD - движение по осям",
        "numAdd / numSub - приблизить / отдалить",
    ],

    keyHandler: (event: KeyboardEvent, sceneOptions: WebGLSceneOptionsType) => {
        switch (event.code) {
            case 'KeyZ':
                sceneOptions.angle += 2;
                if (sceneOptions.angle == 360) sceneOptions.angle = 0;
                sceneOptions.changed = (sceneOptions.changed == 1) ? 0 : 1;
                break;
            case 'KeyX':
                sceneOptions.angle -= 2;
                if (sceneOptions.angle == -360) sceneOptions.angle = 0;
                sceneOptions.changed = (sceneOptions.changed == 1) ? 0 : 1;
                break;
            case 'KeyC':
                xAngle += 2;
                if (xAngle == 360) xAngle = 0;
                sceneOptions.changed = (sceneOptions.changed == 1) ? 0 : 1;
                break;
            case 'KeyV':
                xAngle -= 2;
                if (xAngle == -360) xAngle = 0;
                sceneOptions.changed = (sceneOptions.changed == 1) ? 0 : 1;
                break;
            case 'NumpadAdd':
                zOption += 0.1;
                sceneOptions.changed = (sceneOptions.changed == 1) ? 0 : 1;
                break;
            case 'NumpadSubtract':
                zOption -= 0.1;
                sceneOptions.changed = (sceneOptions.changed == 1) ? 0 : 1;
                break;
            case 'KeyA':
                xOption -= 0.1;
                sceneOptions.changed = (sceneOptions.changed == 1) ? 0 : 1;
                break;
            case 'KeyD':
                xOption += 0.1;
                sceneOptions.changed = (sceneOptions.changed == 1) ? 0 : 1;
                break;
            case 'KeyW':
                yOption += 0.1;
                sceneOptions.changed = (sceneOptions.changed == 1) ? 0 : 1;
                break;
            case 'KeyS':
                yOption -= 0.1;
                sceneOptions.changed = (sceneOptions.changed == 1) ? 0 : 1;
                break;
        }
    },

    initialize(gl, sceneOptions: WebGLSceneOptionsType) {
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        // Модель сферы с заданным радиусом
        model = createSphere(globals.sphereRadius, 64);

        // Инициализация шейдеров
        program = createShaderProgram(gl);

        // Инициализация буферов
        buffers = setupModelBuffers(gl, model);

        return;
    },

    render(gl, sceneOptions: WebGLSceneOptionsType) {
        const modelViewMatrix = mat4.create();
        const angX = xAngle * Math.PI / 180;
        const angY = sceneOptions.angle * Math.PI / 180;

        mat4.translate(modelViewMatrix, modelViewMatrix, [xOption, yOption, zOption]);
        mat4.rotateX(modelViewMatrix, modelViewMatrix, angX);
        mat4.rotateY(modelViewMatrix, modelViewMatrix, angY);

        const fieldOfView = (45 * Math.PI) / 180;
        const aspect = gl.canvas.width / gl.canvas.height;
        const zNear = 0.01;
        const zFar = 100;
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

        // Матрица нормалей
        const normalMatrix = mat3.create();
        mat3.normalFromMat4(normalMatrix, modelViewMatrix);

        // Первый шар
        renderModel(gl, program, buffers, modelViewMatrix, projectionMatrix, normalMatrix);

        // Второй шар (смещён)
        mat4.translate(modelViewMatrix, modelViewMatrix, [3, 0, 0]);
        renderModel(gl, program, buffers, modelViewMatrix, projectionMatrix, normalMatrix);
    },

    dispose(gl) {

    },
}

