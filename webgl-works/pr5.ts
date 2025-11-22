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
import { Mesh} from "webgl-obj-loader";
import { fsSourceRed, vsSource } from "./pr5-src";
import { cart } from "./cart";

export const PR5: WorkType = {
    id: "5",
    name: "Практика № 5",
    controls: [
        "...",
    ],

    keyHandler: (event: KeyboardEvent, sceneOptions: WebGLSceneOptionsType) => {
        switch (event.code) {
            case 'KeyZ':
                sceneOptions.angle += 2;
                if (sceneOptions.angle == 360) sceneOptions.angle = 0;
                break;
            case 'KeyX':
                sceneOptions.angle -= 2;
                if (sceneOptions.angle == -360) sceneOptions.angle = 0;
                break;
        }
    },

    async initialize(gl, sceneOptions: WebGLSceneOptionsType) {

        /*const mutable = {
            figures: [] as number[][][], // Фигуры для рендера
            colors: [] as number[], // Цвета для отрисовки
            vsShaders: [] as string[],
            fsShaders: [] as string[],
            matrices: [] as mat4[],
        }

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        sceneOptions.primitive = gl.TRIANGLES;
        const model = new Mesh(cart);

        const transformMatrix = mat4.create();
        // Преобразуем градусы в радианы
        const angX = 30 * Math.PI / 180;  // 30° вокруг OX
        const angY = sceneOptions.angle * Math.PI / 180;   // вокруг OY
        // Применяем повороты (важен порядок!)6
        mat4.translate(transformMatrix, transformMatrix, [0, 0, -2]);
        mat4.rotateX(transformMatrix, transformMatrix, angX);  // Сначала вокруг X
        mat4.rotateY(transformMatrix, transformMatrix, angY);
        mutable.matrices = [transformMatrix];

        const modelVerts = [];
        for (let i = 0; i < model.vertices.length - 2; i++) {
            modelVerts.push([model.vertices[i], model.vertices[i + 1], model.vertices[i + 2]])
        }

        mutable.figures.push(modelVerts);

        const renderProgram = {
            programInfoList: [] as WebGLProgramInfoType[],
            buffersList: [] as { position: WebGLBuffer; color: WebGLBuffer | null; }[],
            transformMatrices: [] as mat4[],
        }

        // Автодополнение
        mutable.fsShaders = [...mutable.fsShaders, ...Array(mutable.figures.length - mutable.fsShaders.length).fill(fsSourceRed)]
        mutable.vsShaders = [...mutable.vsShaders, ...Array(mutable.figures.length - mutable.vsShaders.length).fill(vsSource)]
        mutable.matrices = [...mutable.matrices, ...Array(mutable.figures.length - mutable.matrices.length).fill(mat4.create())]

        for (let i = 0; i < mutable.figures.length; i++) {
            // Компиляция шейдерной программы и инициализация буферов
            const shaderProgram = initShaderProgram(gl, mutable.vsShaders[i], mutable.fsShaders[i]);
            const buffer = (sceneOptions.currentTask == 3) ? initBuffers(gl, mutable.figures[i], mutable.colors) : initBuffers(gl, mutable.figures[i])
            if (!shaderProgram) {
                alert(`Initializing shader program is failed`);
                return null;
            }

            if (!buffer) {
                alert(`Initializing buffers is failed`);
                return null;
            }

            // Составление программы для рендера
            renderProgram.buffersList.push(buffer);
            renderProgram.programInfoList.push({
                program: shaderProgram,
                vertexCount: mutable.figures[i].length,
                attribLocations: {
                    vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
                    vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
                },
                uniformLocations: {
                    projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
                    modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
                    transformMatrix: gl.getUniformLocation(shaderProgram, "uTransformMatrix"),
                    pointSize: gl.getUniformLocation(shaderProgram, "uPointSize"),
                },
            });
            renderProgram.transformMatrices.push(mutable.matrices[i]);
        }

        // Отрисовка
        renderAll(gl, renderProgram, sceneOptions);
        return;*/

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        sceneOptions.primitive = gl.TRIANGLES;
        const model = new Mesh(cart);

        console.log('Максимальный индекс:', Math.max(...model.indices));
        console.log('Минимальный индекс:', Math.min(...model.indices));
        console.log(`
            Всего вершин: ${model.vertices.length / 3}, 
            Всего индексов: ${model.indices.length}, 
            Всего нормалей: ${model.vertexNormals.length / 3},
            Всего текстур: ${model.textures.length / 2},
            Индексы: ${model.indices}, 
            `);

        const program = createShaderProgram(gl);
        const buffers = setupModelBuffers(gl, model);

        // Создаем матрицы
        const modelViewMatrix = mat4.create();
        // Преобразуем градусы в радианы
        //const angX = 30 * Math.PI / 180;  // 30° вокруг OX
        const angY = sceneOptions.angle * Math.PI / 180;   // вокруг OY
        //mat4.rotateX(modelViewMatrix, modelViewMatrix, angX); 
        mat4.translate(modelViewMatrix, modelViewMatrix, [0, -0.5, -2]);
        mat4.rotateY(modelViewMatrix, modelViewMatrix, angY);


        const fieldOfView = (45 * Math.PI) / 180; // in radians
        const aspect = gl.canvas.width / gl.canvas.height;
        const zNear = 0.1;
        const zFar = 100.0;
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

        return;
    }
}

