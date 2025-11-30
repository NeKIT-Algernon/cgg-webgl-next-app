// Практическая работа № 1. Создание оконного приложения.
//
// С использованием шейдерных программ отобразить на окне три 
// треугольника разных цветов. Для каждого треугольника следует создать свой 
// фрагментный шейдер, определяющий его цвет. 

import { WebGLProgramInfoType, WebGLSceneOptionsType, WorkType } from "@/types/webGLWork";
import { initShaderProgram } from "./webgl-help/initShaders";
import { initBuffers } from "./webgl-help/initBuffers";
import { renderAll } from "./webgl-help/draw";
import { vsSource, fsSourcetri1, fsSourcetri2, fsSourcetri3, positionsTri1, positionsTri2, positionsTri3 } from "./pr1-src";

export const PR1: WorkType = {
    id: "1",
    name: "Практика № 1",
    initialize(gl, SceneOptions: WebGLSceneOptionsType) {
        return;
    },
    
    render(gl, sceneOptions: WebGLSceneOptionsType){
        console.log("Render PR1");
        // Инициализация шейдерных программ
        const shaderProgramTri1 = initShaderProgram(gl, vsSource, fsSourcetri1);
        const shaderProgramTri2 = initShaderProgram(gl, vsSource, fsSourcetri2);
        const shaderProgramTri3 = initShaderProgram(gl, vsSource, fsSourcetri3);
        if (!shaderProgramTri1 || !shaderProgramTri2 || !shaderProgramTri3){
            alert(`Initializing shader program is failed`);
            return null;
        }
        const shaders = [shaderProgramTri1, shaderProgramTri2, shaderProgramTri3];

        // Инициализация буферов
        const buffersTri1 = initBuffers(gl, positionsTri1);
        const buffersTri2 = initBuffers(gl, positionsTri2);
        const buffersTri3 = initBuffers(gl, positionsTri3);
        if (!buffersTri1 || !buffersTri2 || !buffersTri3){
            alert(`Initializing buffers is failed`);
            return null;
        }
        const buffers = [buffersTri1, buffersTri2, buffersTri3]

        // Заготовка для рендера фигур
        const renderProgram = {
            programInfoList: [] as WebGLProgramInfoType[],
            buffersList: buffers,
        }

        // Добавляем в цикле ProgramInfo для каждой шейдерной программы
        for (let i = 0; i < shaders.length; i++){
            renderProgram.programInfoList.push({
                program: shaders[i],
                vertexCount: 3, // Потому что в этом задании только треугольники
                attribLocations: {
                    vertexPosition: gl.getAttribLocation(shaders[i], "aVertexPosition"),
                    vertexColor: gl.getAttribLocation(shaders[i], "aVertexColor"),
            },
                uniformLocations: {
                    projectionMatrix: gl.getUniformLocation(shaders[i], "uProjectionMatrix"),
                    modelViewMatrix: gl.getUniformLocation(shaders[i], "uModelViewMatrix"),
                    transformMatrix: gl.getUniformLocation(shaders[i], "uTransformMatrix"),
                    pointSize: gl.getUniformLocation(shaders[i], "uPointSize"),
            },
        })
        }

        // Выполняем рендер с базовыми настройками
        renderAll(gl, renderProgram);
    },

    dispose(gl){

    },
}