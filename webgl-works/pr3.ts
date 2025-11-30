import { initShaderProgram } from "./webgl-help/initShaders";
import { initBuffers } from "./webgl-help/initBuffers";
import { renderAll, drawScene } from "./webgl-help/draw";
import {
    createRegularPolygon,
    fsSourceRed,
    fsSourceBlue,
    fsSourceGreen,
    globals,
    vsSource,
    square,
    triangle,
    line,
    butterflyTriangle,
} from "./pr3-src";
import { mat4 } from "gl-matrix";
import { WebGLProgramInfoType, WebGLSceneOptionsType, WorkType } from "@/types/webGLWork";

export const PR3: WorkType = {
    id: "3",
    name: "Практика № 3",
    controls: [
        "1...3 или left / right - переключение по заданиям ",
        "QWER - переключение между пунктами задания 1-4 (для задания 1)",
        "M - переключение между режимами (для задания 2)",
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
            case 'KeyQ':
                if (sceneOptions.currentTask != 1) break;
                sceneOptions.currentSubTask = 1;
                break;
            case 'KeyW':
                if (sceneOptions.currentTask != 1) break;
                sceneOptions.currentSubTask = 2;
                break;
            case 'KeyE':
                if (sceneOptions.currentTask != 1) break;
                sceneOptions.currentSubTask = 3;
                break;
            case 'KeyR':
                if (sceneOptions.currentTask != 1) break;
                sceneOptions.currentSubTask = 4;
                break;
            case 'KeyM':
                if (sceneOptions.currentTask != 2) break;
                sceneOptions.currentSubTask = (sceneOptions.currentSubTask != 1) ? 1 : 2;
                break;
        }
    },

    initialize(gl, sceneOptions: WebGLSceneOptionsType) {

        
    },

    render(gl, sceneOptions: WebGLSceneOptionsType){
        console.log("Render PR3");
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
                mutable.figures.push(createRegularPolygon(globals.n));
                mutable.vsShaders = [vsSource];
                mutable.fsShaders = [fsSourceRed];
                switch (sceneOptions.currentSubTask) {
                    case 1:
                        sceneOptions.primitive = gl.TRIANGLES;
                        while (mutable.figures[0].length % 3 != 0) {
                            mutable.figures[0].pop();
                        }
                        break;
                    case 2:
                        const lines_array = [];
                        for (let i = 0; i < mutable.figures[0].length; i++) {
                            for (let k = i + 1; k < mutable.figures[0].length; k++) {
                                lines_array.push(mutable.figures[0][i]);
                                lines_array.push(mutable.figures[0][k]);
                            }
                        }
                        mutable.figures[0] = lines_array;
                        sceneOptions.primitive = gl.LINES;
                        break;
                    case 3:
                        sceneOptions.primitive = gl.LINE_LOOP;
                        break;
                    case 4:
                        const line_array: number[][] = [];
                        mutable.figures[0].map((p, i) => {
                            if (i % 2 == 0) {
                                line_array.push(p);
                            }
                        });

                        mutable.figures[0] = line_array;
                        sceneOptions.primitive = gl.LINE_LOOP;
                        break;
                }
                break;
            case 2:
                sceneOptions.primitive = gl.LINE_LOOP;
                mutable.figures = [square, triangle, line];
                mutable.fsShaders = [fsSourceRed, fsSourceGreen, fsSourceBlue];
                mutable.vsShaders = [vsSource, vsSource, vsSource];

                switch (sceneOptions.currentSubTask) {
                    case 1:
                        break;
                    case 2:
                        const rectangleMatrix = mat4.create();
                        mat4.translate(rectangleMatrix, rectangleMatrix, [globals.x, globals.y, 0]);
                        mat4.rotateZ(rectangleMatrix, rectangleMatrix, globals.b);
                        mat4.translate(rectangleMatrix, rectangleMatrix, [-globals.x, -globals.y, 0]);

                        const triangleMatrix = mat4.create();
                        mat4.translate(triangleMatrix, triangleMatrix, [globals.px, globals.py, 0]);
                        mat4.scale(triangleMatrix, triangleMatrix, [globals.kx, globals.ky, 1]);

                        const lineMatrix = mat4.create();
                        mat4.rotateZ(lineMatrix, lineMatrix, globals.a);

                        mutable.matrices = [rectangleMatrix, triangleMatrix, lineMatrix];
                        break;
                }
                break;
            case 3:
                sceneOptions.primitive = gl.LINE_LOOP;
                mutable.fsShaders = [fsSourceRed, fsSourceRed, fsSourceRed, fsSourceRed];
                mutable.vsShaders = [vsSource, vsSource, vsSource, vsSource];
                mutable.figures = [butterflyTriangle, butterflyTriangle, butterflyTriangle, butterflyTriangle];

                const mat_ld = mat4.create();
                mat4.rotateZ(mat_ld, mat_ld, Math.PI / 10);
                mat4.scale(mat_ld, mat_ld, [0.7, -0.7, 1]);

                const mat_rt = mat4.create();
                mat4.scale(mat_rt, mat_rt, [-1, 1, 1]);

                const mat_rd = mat4.create();
                mat4.scale(mat_rd, mat_rd, [-1, 1, 1]);
                mat4.scale(mat_rd, mat_rd, [0.7, -0.7, 1]);
                mat4.rotateZ(mat_rd, mat_rd, -Math.PI / 10);

                mutable.matrices = [mat4.create(), mat_ld, mat_rt, mat_rd]
                break;
        }

        const renderProgram = {
            programInfoList: [] as WebGLProgramInfoType[],
            buffersList: [] as { position: WebGLBuffer; color: WebGLBuffer | null; }[],
            transformMatrices: [] as mat4[],
        }

        for (let i = 0; i < mutable.figures.length; i++) {

            // Компиляция шейдерной программы и инициализация буферов
            const shaderProgram = initShaderProgram(gl, mutable.vsShaders[i], mutable.fsShaders[i]);
            const buffer = initBuffers(gl, mutable.figures[i]);
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
        renderAll(gl, renderProgram, sceneOptions)
        return;
    },

    dispose(gl){

    },
}

