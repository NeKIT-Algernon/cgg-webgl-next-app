import { mat3, mat4, vec3 } from "gl-matrix";
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
    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();
    const modelMatrix = mat4.create();
    const modelViewMatrix = mat4.create();

    const aspect = gl.canvas.width / gl.canvas.height;
    mat4.perspective(projectionMatrix, (45 * Math.PI) / 180, aspect, 0.01, 100);

    // --- Параметры камеры ---
    const cameraRadius = 4*globals.sphereRadius; // расстояние от центра сцены
    const centerY = 0;      // высота камеры
    const centerX = 2*globals.sphereRadius;    // центр между сферами (между 0 и 3)
    const centerZ = 0;

    const angleX = 30 * Math.PI / 180; // наклон камеры вверх/вниз
    const angleY = sceneOptions.angle * Math.PI / 180; // вращение вокруг OY

    const camX = centerX + Math.sin(angleY) * cameraRadius;
    const camZ = centerZ - Math.cos(angleY) * cameraRadius; // минус, чтобы камера смотрела внутрь
    const camY = centerY + Math.sin(angleX) * cameraRadius;

    // Матрица вида: камера смотрит в центр
    mat4.lookAt(
        viewMatrix,
        [camX, camY, camZ],      // позиция камеры
        [centerX, centerY, 0],   // точка, на которую смотрим
        [0, 1, 0]                // вектор "вверх"
    );

    // --- Материал и свет (если используется Phong) ---
    const lightDirWorld = vec3.normalize(vec3.create(), [1, 1, -1]); // свет из правого верхнего угла
    const lightDirView = vec3.transformMat3(vec3.create(), lightDirWorld, viewMatrix);
    vec3.normalize(lightDirView, lightDirView);

    // --- Первая сфера (x=0) ---
    mat4.identity(modelMatrix);
    mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);

    const normalMatrix1 = mat3.create();
    mat3.normalFromMat4(normalMatrix1, modelViewMatrix);

    renderModel(
        gl, program, buffers,
        modelViewMatrix, projectionMatrix, normalMatrix1,
        globals.material1,
        lightDirView
    );

    // --- Вторая сфера (x=3) ---
    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, modelMatrix, [2*globals.sphereRadius, 0, 0]);

    mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);

    const normalMatrix2 = mat3.create();
    mat3.normalFromMat4(normalMatrix2, modelViewMatrix);

    renderModel(
        gl, program, buffers,
        modelViewMatrix, projectionMatrix, normalMatrix2,
        globals.material2,
        lightDirView
    );
},


    dispose(gl) {

    },
}

