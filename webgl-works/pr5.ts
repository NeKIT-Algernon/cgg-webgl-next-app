import { mat4 } from "gl-matrix";
import { WebGLProgramInfoType, WebGLSceneOptionsType, WorkType } from "@/types/webGLWork";
import { initShaderProgram } from "./webgl-help/initShaders";
import { initBuffers } from "./webgl-help/initBuffers";
import { renderAll } from "./webgl-help/draw";
import {
    globals,
    createShaderProgram,
    setupModelBuffers,
    renderModel,

} from "./pr5-src";
import { Mesh } from "webgl-obj-loader";
import { fsSourceRed, vsSource } from "./pr5-src";
import { cart } from "./cart";

let model;
let program: WebGLProgram;
let buffers: {
    vertexBuffer: WebGLBuffer;
    normalBuffer: WebGLBuffer | null;
    indexBuffer: WebGLBuffer;
    vertexCount: number;
};

let yOption = 0.3;
let zOption = -7;
let xOption = 0;

export const PR5: WorkType = {
    id: "5",
    name: "Практика № 5",
    controls: [
        "Z/X - вращение",
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
            case 'NumpadAdd':
                zOption += 0.1;
                if (zOption > -5) zOption = -5;
                sceneOptions.changed = (sceneOptions.changed == 1) ? 0 : 1;
                break;
            case 'NumpadSubtract':
                zOption -= 0.1;
                if (zOption < -13) zOption = -13;
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

        sceneOptions.primitive = gl.TRIANGLES;
        model = new Mesh(cart);

        program = createShaderProgram(gl);
        buffers = setupModelBuffers(gl, model);

        return;
    },

    render(gl, sceneOptions: WebGLSceneOptionsType) {
        console.log("Render PR5");
        // Создаем матрицы
        const modelViewMatrix = mat4.create();

        //mat4.scale(modelViewMatrix, modelViewMatrix, [4, 4, 4]);

        // Преобразуем градусы в радианы
        const angX = 30 * Math.PI / 180;
        const angY = sceneOptions.angle * Math.PI / 180;   // вокруг OY 

        mat4.translate(modelViewMatrix, modelViewMatrix, [xOption, yOption, zOption]);
        mat4.rotateX(modelViewMatrix, modelViewMatrix, angX);
        mat4.rotateY(modelViewMatrix, modelViewMatrix, angY);


        const fieldOfView = (45 * Math.PI) / 180; // in radians
        const aspect = gl.canvas.width / gl.canvas.height;
        const zNear = 6;
        const zFar = 12;
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

        const normalMatrix = new Float32Array([
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ]);

        renderModel(
            gl,
            program,
            buffers,
            modelViewMatrix,
            projectionMatrix,
            normalMatrix
        );
    },

    dispose(gl) {

    },
}

