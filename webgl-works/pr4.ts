import { initShaderProgram } from "./webgl-help/initShaders";
import { initBuffers } from "./webgl-help/initBuffers";
import { renderAll } from "./webgl-help/draw";
import {
    vsSource,
    globals,
    fig1,
    fig2,
    fig3,
    fsSourceRed,
    fsSourceBlue,
    fsSourceGreen,
    cube,
    orthoDraw,
    cubeColors,
    cubeLines,
} from "./pr4-src";
import { mat4 } from "gl-matrix";
import { WebGLProgramInfoType, WebGLSceneOptionsType, WorkType } from "@/types/webGLWork";
import { fsSourceColor } from "./pr2-src";

export const PR4: WorkType = {
    id: "4",
    name: "Практика № 4",
    controls: [
        "1...6 или left / right - переключение по заданиям",
        "Z / X - поворот куба (задание 6)"
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
            case 'Digit4':
                sceneOptions.currentTask = 4;
                sceneOptions.currentSubTask = 1;
                break;
            case 'Digit5':
                sceneOptions.currentTask = 5;
                sceneOptions.currentSubTask = 1;
                break;
            case 'Digit6':
                sceneOptions.currentTask = 6;
                sceneOptions.currentSubTask = 1;
                break;
            case 'KeyZ':
                if (sceneOptions.currentTask != 6) return;
                sceneOptions.angle+=2;
                if (sceneOptions.angle == 360) sceneOptions.angle = 0;
                break;
            case 'KeyX':
                if (sceneOptions.currentTask != 6) return;
                sceneOptions.angle-=2;
                if (sceneOptions.angle == -360) sceneOptions.angle = 0;
                break;
        }
    },

    async initialize(gl, sceneOptions: WebGLSceneOptionsType) {

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
                sceneOptions.primitive = gl.TRIANGLES;
                mutable.figures = [fig1, fig2, fig3];
                mutable.fsShaders = [fsSourceRed, fsSourceBlue, fsSourceGreen]
                break;
            case 2:
                sceneOptions.primitive = gl.TRIANGLES;
                mutable.figures = [fig1, fig2, fig3];
                mutable.fsShaders = [fsSourceRed, fsSourceBlue, fsSourceGreen]
                gl.enable(gl.DEPTH_TEST);
                gl.depthFunc(gl.LEQUAL);
                break;
            // ДОДЕЛАТЬ РАЗОБРАТЬСЯ
            case 3:
                mutable.figures = [cube];
                mutable.fsShaders = [fsSourceColor]
                sceneOptions.primitive = gl.TRIANGLES;
                gl.enable(gl.DEPTH_TEST);
                gl.depthFunc(gl.LEQUAL);
                mutable.colors = cubeColors;
                break;
            case 4:
                mutable.figures = [cubeLines];
                sceneOptions.primitive = gl.LINES;
                gl.enable(gl.DEPTH_TEST);
                gl.depthFunc(gl.LEQUAL);
                break;
            case 5:
                mutable.figures = [cube];
                mutable.fsShaders = [fsSourceColor]
                sceneOptions.primitive = gl.TRIANGLES;
                gl.enable(gl.DEPTH_TEST);
                gl.depthFunc(gl.LEQUAL);
                mutable.colors = cubeColors;
                const rotationMatrix = mat4.create();
                // Преобразуем градусы в радианы
                const angleX = -25 * Math.PI / 180;  // -25° вокруг OX
                const angleY = 60 * Math.PI / 180;   // 60° вокруг OY
                // Применяем повороты (важен порядок!)
                mat4.translate(rotationMatrix, rotationMatrix, [0, 0, -2]);
                mat4.rotateX(rotationMatrix, rotationMatrix, angleX);  // Сначала вокруг X
                mat4.rotateY(rotationMatrix, rotationMatrix, angleY);

                //mat4.translate(rotationMatrix, rotationMatrix, [0, 0, -3]);

                mutable.matrices = [rotationMatrix];
                break;
            case 6:
                mutable.figures = [cube];
                mutable.fsShaders = [fsSourceColor]
                sceneOptions.primitive = gl.TRIANGLES;
                gl.enable(gl.DEPTH_TEST);
                gl.depthFunc(gl.LEQUAL);
                mutable.colors = cubeColors;
                const transformMatrix = mat4.create();
                // Преобразуем градусы в радианы
                const angX = 30 * Math.PI / 180;  // 30° вокруг OX
                const angY = sceneOptions.angle * Math.PI / 180;   // вокруг OY
                // Применяем повороты (важен порядок!)6
                mat4.translate(transformMatrix, transformMatrix, [0, 0, -2]);
                mat4.rotateX(transformMatrix, transformMatrix, angX);  // Сначала вокруг X
                mat4.rotateY(transformMatrix, transformMatrix, angY);

                mutable.matrices = [transformMatrix];
                break;
        }

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
        if (sceneOptions.currentTask == 3) orthoDraw(gl, renderProgram, sceneOptions);
        else renderAll(gl, renderProgram, sceneOptions);
        gl.disable(gl.DEPTH_TEST);
        return;
    }
}

