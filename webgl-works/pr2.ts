import { initShaderProgram } from "./webgl-help/initShaders";
import { initBuffers } from "./webgl-help/initBuffers";
import { renderAll, drawScene } from "./webgl-help/draw";
import {
    globals,
    createRegularPolygon,
    generateRandomColor,
    vsSource,
    fsSourceRed,
    fsSourceRedPoint,
    fsSourceColor,
    figureVerts1,
    figureVerts2,
    figureVerts3,
} from "./pr2-src";
import { WebGLProgramInfoType, WebGLSceneOptionsType, WorkType } from "@/types/webGLWork";

export const PR2: WorkType = {
    id: "2",
    name: "Практическая работа № 2",
    controls: [
        "1...8 или left / right - переключение по заданиям ",
        "P / O - увеличение / уменьшение точек (только для 1-го задания)",
        "L / K - увеличение / уменьшение толщины линий (не работает)",
        "T / Y / U - примитивы TRIANGLES / TRIANGLE_STRIP / TRIANGLE_FAN (только для 5-го задания)",
        "Z / X / C - подпункты a / b / c соответственно (только для 8-го задания)",
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
            case 'Digit7':
                sceneOptions.currentTask = 7;
                sceneOptions.currentSubTask = 1;
                break;
            case 'Digit8':
                sceneOptions.currentTask = 8;
                sceneOptions.currentSubTask = 1;
                break;
            case 'KeyP':
                if (sceneOptions.currentTask == 1) sceneOptions.pointSize = Math.min(sceneOptions.pointSize + 1.0, 100.0);
                break;
            case 'KeyO':
                if (sceneOptions.currentTask == 1) sceneOptions.pointSize = Math.max(sceneOptions.pointSize - 1.0, 1);
                break;
            case 'KeyL':
                sceneOptions.lineThickness = Math.min(sceneOptions.lineThickness + 1.0, 100.0);
                break;
            case 'KeyK':
                sceneOptions.lineThickness = Math.max(sceneOptions.lineThickness - 1.0, 1);
                break;
            case 'KeyT':
                sceneOptions.primitive = 4;
                break;
            case 'KeyY':
                sceneOptions.primitive = 5;
                break;
            case 'KeyU':
                sceneOptions.primitive = 6;
                break;
            case 'KeyZ':
                sceneOptions.currentSubTask = 1;
                break;
            case 'KeyX':
                sceneOptions.currentSubTask = 2;
                break;
            case 'KeyC':
                sceneOptions.currentSubTask = 3;
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
                sceneOptions.primitive = gl.POINTS;
                mutable.verts = createRegularPolygon(globals.n, 0.5);
                break;
            case 2:
                sceneOptions.primitive = gl.LINES;
                const polygonVerts = createRegularPolygon(globals.n, 0.5);

                mutable.verts.push(polygonVerts[0]);
                for (let i = 1; i < polygonVerts.length; i += 1) {
                    mutable.verts.push(polygonVerts[i]);
                    mutable.verts.push(polygonVerts[i]);
                }
                mutable.verts.push(polygonVerts[0]);
                break;
            case 3:
                sceneOptions.primitive = gl.LINE_STRIP;
                mutable.verts = figureVerts1;
                break;
            case 4:
                sceneOptions.primitive = gl.LINE_LOOP;
                mutable.verts = figureVerts2;
                break;
            case 5:
                if (sceneOptions.primitive != gl.TRIANGLES && sceneOptions.primitive != gl.TRIANGLE_STRIP && sceneOptions.primitive != gl.TRIANGLE_FAN) sceneOptions.primitive = gl.TRIANGLES;

                if (sceneOptions.primitive == gl.TRIANGLES) {
                    mutable.verts = [];
                    for (let i = 1; i < figureVerts2.length - 1; i += 1) {
                        mutable.verts.push(figureVerts2[0]);
                        mutable.verts.push(figureVerts2[i]);
                        mutable.verts.push(figureVerts2[i + 1]);

                        const color = generateRandomColor();

                        // Каждой вершине треугольника присваиваем одинаковый цвет
                        for (let j = 0; j < 3; j++) {
                            mutable.colors.push(...color);
                        }
                    }
                }

                if (sceneOptions.primitive == gl.TRIANGLE_STRIP) {
                    mutable.verts = [];
                    // Нужно расположить точки таким образом
                    const array = [
                        figureVerts2[6],
                        figureVerts2[7],
                        figureVerts2[5],
                        figureVerts2[0],
                        figureVerts2[4],
                        figureVerts2[1],
                        figureVerts2[3],
                        figureVerts2[2],
                    ];

                    const triangleCount = figureVerts2.length - 2;
                    for (let i = 0; i < triangleCount; i++) {
                        mutable.verts.push(array[i]);
                        mutable.verts.push(array[i + 1]);
                        mutable.verts.push(array[i + 2]);
                        const color = generateRandomColor();
                        for (let j = 0; j < 3; j++) {
                            mutable.colors.push(...color);
                        }
                    }
                }

                if (sceneOptions.primitive == gl.TRIANGLE_FAN) {
                    mutable.verts = figureVerts2;
                }
                for (let i = 0; i < figureVerts2.length; i++) {
                    const color = generateRandomColor();
                    mutable.colors.push(...color);
                }
                break;
            case 6:
                sceneOptions.primitive = gl.TRIANGLE_FAN;
                mutable.verts = createRegularPolygon(globals.n, 0.5);
                for (let i = 0; i < figureVerts2.length; i++) {
                    const color = generateRandomColor();
                    mutable.colors.push(...color);
                }
                break;
            case 7:
                console.log("Entered 7");
                sceneOptions.primitive = gl.TRIANGLES;
                mutable.verts = [];
                for (let i = 0; i < figureVerts3.length - 2; i++) {
                    mutable.verts.push(figureVerts3[i]);
                    mutable.verts.push(figureVerts3[i + 1]);
                    mutable.verts.push(figureVerts3[i + 2]);

                    const color = generateRandomColor();
                    for (let j = 0; j < 3; j++) {
                        mutable.colors.push(...color);
                    }
                }
                break;
            case 8:
                console.log("Entered 8");
                mutable.verts = [];

                if (sceneOptions.currentSubTask == 1) {
                    mutable.verts = figureVerts3;
                    sceneOptions.primitive = gl.POINTS;

                    gl.enable(gl.CULL_FACE);
                    gl.frontFace(gl.CCW);
                    gl.cullFace(gl.BACK); // Отсекать обратные грани
                }

                if (sceneOptions.currentSubTask == 2) {
                    sceneOptions.primitive = gl.LINE_STRIP;
                    for (let i = 0; i < figureVerts3.length - 2; i++) {
                        mutable.verts.push(figureVerts3[i]);
                        mutable.verts.push(figureVerts3[i + 1]);
                        mutable.verts.push(figureVerts3[i + 2]);
                        mutable.verts.push(figureVerts3[i]);
                    }

                    const fShader = fsSourceRed;
                    const shaderProgram = initShaderProgram(gl, vsSource, fShader);
                    const buffer = initBuffers(gl, mutable.verts);
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

                    mutable.verts = [];
                    gl.enable(gl.CULL_FACE);
                    gl.cullFace(gl.FRONT);
                    sceneOptions.primitive = gl.TRIANGLES;
                    for (let i = 0; i < figureVerts3.length - 2; i++) {
                        mutable.verts.push(figureVerts3[i]);
                        mutable.verts.push(figureVerts3[i + 1]);
                        mutable.verts.push(figureVerts3[i + 2]);
                    }

                    const buffer1 = initBuffers(gl, mutable.verts);
                    renderProgram.programInfoList[0].vertexCount = mutable.verts.length;
                    drawScene(gl, renderProgram.programInfoList[0], buffer1, sceneOptions);
                    return;
                }

                if (sceneOptions.currentSubTask == 3) {
                    sceneOptions.primitive = gl.LINE_STRIP;

                    for (let i = 0; i < figureVerts3.length - 2; i++) {
                        mutable.verts.push(figureVerts3[i]);
                        mutable.verts.push(figureVerts3[i + 1]);
                        mutable.verts.push(figureVerts3[i + 2]);
                        mutable.verts.push(figureVerts3[i]);
                    }
                }

                break;
        }
        // Компиляция шейдерной программы и инициализация буферов
        // Для 5-го задания используем цвета, для остальных - нет
        const fShader = (sceneOptions.primitive == gl.POINTS) ? fsSourceRedPoint : (sceneOptions.currentTask >= 5 && sceneOptions.currentTask < 8) ? fsSourceColor : fsSourceRed;
        const shaderProgram = initShaderProgram(gl, vsSource, fShader);
        const buffer = (sceneOptions.currentTask >= 5 && sceneOptions.currentTask < 8) ? initBuffers(gl, mutable.verts, mutable.colors) : initBuffers(gl, mutable.verts);
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
        gl.disable(gl.CULL_FACE);
        return;
    }
}

