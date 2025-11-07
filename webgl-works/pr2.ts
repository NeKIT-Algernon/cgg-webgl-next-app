import { initShaderProgram } from "./webgl-help/initShaders";
import { initBuffers } from "./webgl-help/initBuffers";
import { renderAll } from "./webgl-help/draw";
import { globals, createRegularPolygon, vsSource, fsSourceRed } from "./pr2-src";

export const PR2: WorkType = {
    id: "2",
    name: "Практическая работа № 2",
    controls: [
        "1...8 или left / right - переключение по заданиям ",
        "p / o - увеличение / уменьшение точек",
    ],

    keyHandler: (event: KeyboardEvent, sceneOptions: WebGLSceneOptionsType) => {
        switch(event.code){
            case 'KeyP':
                if (sceneOptions.pointSize) sceneOptions.pointSize = Math.min(sceneOptions.pointSize + 1.0, 100.0);
                break;
            case 'KeyO':
                if (sceneOptions.pointSize) sceneOptions.pointSize = Math.max(sceneOptions.pointSize - 1.0, 1);
                break;
        }
    },

    async initialize(gl, sceneOptions: WebGLSceneOptionsType) {
        const mutable = {
            verts: [0], // Вершины для отрисовки
        }

        // Изменения по заданиям
        switch (sceneOptions.currentTask) {
            case 1:
                sceneOptions.primitive = 0;
                mutable.verts = createRegularPolygon(globals.n, 0.5);
                break;
        }
        // Компиляция шейдерной программы и инициализация буферов
        const shaderProgram = initShaderProgram(gl, vsSource, fsSourceRed);
        if (!shaderProgram) {
            alert(`Initializing shader program is failed`);
            return null;
        }
        const buffer = initBuffers(gl, mutable.verts);
        if (!buffer) {
            alert(`Initializing buffers is failed`);
            return null;
        }

        // Составление программы для рндера
        const renderProgram = {
            programInfoList: [] as WebGLProgramInfoType[],
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

        // Отрисовка
        renderAll(gl, renderProgram, sceneOptions)
        return;
    }
}

