import { initShaderProgram } from "./webgl-help/initShaders";
import { initBuffers } from "./webgl-help/initBuffers";
import { renderAll, drawScene } from "./webgl-help/draw";
import {
    createRegularPolygon,
    fsSourceRed,
    fsSourceRedPoint,
    globals,
    vsSource
} from "./pr3-src";
import { IoTriangleSharp } from "react-icons/io5";

export const PR3: WorkType = {
    id: "3",
    name: "Практическая работа № 3",
    controls: [
        "1...3 или left / right - переключение по заданиям ",
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
            case 'Digit2':
                sceneOptions.currentTask = 2;
                sceneOptions.currentSubTask = 1;
                break;
            case 'Digit3':
                sceneOptions.currentTask = 3;
                sceneOptions.currentSubTask = 1;
                break;
        }
    },

    async initialize(gl, sceneOptions: WebGLSceneOptionsType) {

        const mutable = {
            verts: [] as number[][], // Вершины для отрисовки
            colors: [] as number[], // Цвета для отрисовки
        }

        // Изменения по заданиям
        switch (sceneOptions.currentTask) {
            case 1:
                mutable.verts = createRegularPolygon(globals.n)
                switch (sceneOptions.currentSubTask) {
                    case 1:
                        sceneOptions.primitive = gl.TRIANGLES;
                        while (mutable.verts.length % 3 != 0){
                            mutable.verts.pop();
                        }
                        break;
                    case 2:

                        break;
                    case 3:

                        break;
                    case 4:

                        break;
                }
                break;
            case 2:

                break;
            case 3:

                break;
        }
        // Компиляция шейдерной программы и инициализация буферов
        // Для 5-го задания используем цвета, для остальных - нет
        const fShader = fsSourceRed;
        const shaderProgram = initShaderProgram(gl, vsSource, fShader);
        const buffer = (false) ? initBuffers(gl, mutable.verts, mutable.colors) : initBuffers(gl, mutable.verts);
        if (!shaderProgram) {
            alert(`Initializing shader program is failed`);
            return null;
        }

        if (!buffer) {
            alert(`Initializing buffers is failed`);
            return null;
        }

        // Составление программы для рендера
        const renderProgram = {
            programInfoList: [] as WebGLProgramInfoType[],
            buffersList: [buffer],
        }
        renderProgram.programInfoList.push({
            program: shaderProgram,
            vertexCount: mutable.verts.length,
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

        // Отрисовка
        renderAll(gl, renderProgram, sceneOptions)
        return;
    }
}

