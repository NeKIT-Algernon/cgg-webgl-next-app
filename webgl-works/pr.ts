import { mat4 } from "gl-matrix";
import { WebGLProgramInfoType, WebGLSceneOptionsType, WorkType } from "@/types/webGLWork";
import { initShaderProgram } from "./webgl-help/initShaders";
import { initBuffers } from "./webgl-help/initBuffers";
import { renderAll } from "./webgl-help/draw";
import {
    globals
} from "./pr-src";

export const PRX: WorkType = {
    id: "X",
    name: "Практика № X",
    controls: [
        "1...X или left / right - переключение по заданиям",
    ],
    keyHandler: (event: KeyboardEvent, sceneOptions: WebGLSceneOptionsType) => {
        switch (event.code) {
            case 'ArrowLeft':
                if (sceneOptions.currentTask == 1) {
                    sceneOptions.currentTask = globals.maxTask;
                    break;
                }
                sceneOptions.currentTask--;
                sceneOptions.currentSubTask = 1;
                break;
            case 'ArrowRight':
                if (sceneOptions.currentTask == globals.maxTask) {
                    sceneOptions.currentTask = 1;
                    break;
                }
                sceneOptions.currentTask++;
                sceneOptions.currentSubTask = 1;
                break;
            case 'Digit1':
                sceneOptions.currentTask = 1;
                sceneOptions.currentSubTask = 1;
                break;
            case 'KeyZ':

                break;
        }
    },

    initialize(gl, sceneOptions: WebGLSceneOptionsType) {

        const mutable = {
            figures: [] as number[][][], // Фигуры для рендера
            colors: [] as number[], // Цвета для отрисовки
            vsShaders: [] as string[],
            fsShaders: [] as string[],
            matrices: [mat4.create()],
        }

        // Изменения по заданиям
        switch (sceneOptions.currentTask) {
            case 1:

                break;
        }

        const renderProgram = {
            programInfoList: [] as WebGLProgramInfoType[],
            buffersList: [] as { position: WebGLBuffer; color: WebGLBuffer | null; }[],
            transformMatrices: [] as mat4[],
        }

        // Автодополнение
        /*mutable.fsShaders = [...mutable.fsShaders, ...Array(mutable.figures.length - mutable.fsShaders.length).fill(fsSourceRed)]
        mutable.vsShaders = [...mutable.vsShaders, ...Array(mutable.figures.length - mutable.vsShaders.length).fill(vsSource)]
        mutable.matrices = [...mutable.matrices, ...Array(mutable.figures.length - mutable.matrices.length).fill(mat4.create())]*/

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
        gl.disable(gl.DEPTH_TEST);
        return;
    },

    render(gl, sceneOptions: WebGLSceneOptionsType){

    },

    dispose(gl){

    },
}

