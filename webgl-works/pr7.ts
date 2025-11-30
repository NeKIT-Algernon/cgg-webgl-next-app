// webgl-works/pr7.ts

import { mat4 } from "gl-matrix";
import { WebGLSceneOptionsType, WorkType } from "@/types/webGLWork";
import {
    vsSourceTexture,
    fsSourceTexture,
    loadTexture,
    createTrapezoidWithTexCoords,
    configureTexture,
    TextureSettings,
    defaultTextureSettings,
} from "./pr7-src";

const IMAGE_URL = "/textures/sample.jpg"; // Положи изображение в public/textures/

let program: WebGLProgram | null = null;
let positionBuffer: WebGLBuffer | null = null;
let texCoordBuffer: WebGLBuffer | null = null;
let indexBuffer: WebGLBuffer | null = null;
let texture: WebGLTexture | null = null;
let settings: TextureSettings = { ...defaultTextureSettings };

export const PR7: WorkType = {
    id: "7",
    name: "Практика № 7",
    controls: [
        "Q/W - переключение minFilter",
        "A/D - переключение wrap режима по S",
        "Y/U - wrap по T",
        "T - вкл/выкл текстурирование",
        "R - перезагрузить текстуру",
    ],

    keyHandler: (event: KeyboardEvent, sceneOptions: WebGLSceneOptionsType) => {
        if (!texture) return;

        const gl = (document.querySelector("canvas") as HTMLCanvasElement)
            ?.getContext("webgl2");

        if (!gl) return;

        let updated = false;

        switch (event.code) {
            case "KeyQ": // minFilter: уменьшаем
                if (settings.minFilter === gl.LINEAR) {
                    settings.minFilter = gl.NEAREST;
                } else if (settings.minFilter === gl.NEAREST) {
                    settings.minFilter = gl.LINEAR;
                } else if (settings.minFilter === gl.LINEAR_MIPMAP_LINEAR) {
                    settings.minFilter = gl.LINEAR;
                } else {
                    settings.minFilter = gl.LINEAR_MIPMAP_LINEAR;
                }
                console.log("minFilter:", settings.minFilter);
                updated = true;
                break;

            case "KeyW": // minFilter: увеличиваем
                if (settings.minFilter === gl.LINEAR) {
                    settings.minFilter = gl.LINEAR_MIPMAP_LINEAR;
                } else if (settings.minFilter === gl.LINEAR_MIPMAP_LINEAR) {
                    settings.minFilter = gl.LINEAR;
                } else if (settings.minFilter === gl.NEAREST) {
                    settings.minFilter = gl.LINEAR;
                }
                console.log("minFilter:", settings.minFilter);
                updated = true;
                break;

            case "KeyA": // wrapS: предыдущий режим
                if (settings.wrapS === gl.REPEAT) {
                    settings.wrapS = gl.CLAMP_TO_EDGE;
                } else if (settings.wrapS === gl.CLAMP_TO_EDGE) {
                    settings.wrapS = gl.MIRRORED_REPEAT;
                } else {
                    settings.wrapS = gl.REPEAT;
                }
                console.log("wrapS:", settings.wrapS);
                updated = true;
                break;

            case "KeyD": // wrapS: следующий режим
                if (settings.wrapS === gl.REPEAT) {
                    settings.wrapS = gl.MIRRORED_REPEAT;
                } else if (settings.wrapS === gl.MIRRORED_REPEAT) {
                    settings.wrapS = gl.CLAMP_TO_EDGE;
                } else {
                    settings.wrapS = gl.REPEAT;
                }
                console.log("wrapS:", settings.wrapS);
                updated = true;
                break;

            case "KeyY": // wrapT: предыдущий
                if (settings.wrapT === gl.REPEAT) {
                    settings.wrapT = gl.CLAMP_TO_EDGE;
                } else if (settings.wrapT === gl.CLAMP_TO_EDGE) {
                    settings.wrapT = gl.MIRRORED_REPEAT;
                } else {
                    settings.wrapT = gl.REPEAT;
                }
                console.log("wrapT:", settings.wrapT);
                updated = true;
                break;

            case "KeyU": // wrapT: следующий
                if (settings.wrapT === gl.REPEAT) {
                    settings.wrapT = gl.MIRRORED_REPEAT;
                } else if (settings.wrapT === gl.MIRRORED_REPEAT) {
                    settings.wrapT = gl.CLAMP_TO_EDGE;
                } else {
                    settings.wrapT = gl.REPEAT;
                }
                console.log("wrapT:", settings.wrapT);
                updated = true;
                break;

            case "KeyT": // toggle текстурирование
                settings.useTexture = !settings.useTexture;
                console.log("useTexture:", settings.useTexture);
                updated = true;
                break;

            case "KeyR": // Перезагрузить текстуру
                loadTexture(gl, IMAGE_URL, (newTexture) => {
                    if (newTexture) {
                        if (texture) gl.deleteTexture(texture);
                        texture = newTexture;
                        configureTexture(gl, texture, settings);
                        console.log("Текстура перезагружена");
                    }
                });
                return; // выходим, чтобы не вызывать renderScene дважды
        }

        if (updated) {
            configureTexture(gl, texture, settings);
            sceneOptions.changed = (sceneOptions.changed == 1) ? 0 : 1; // триггер ререндера
        }
    },


    initialize(gl, sceneOptions: WebGLSceneOptionsType) {
        // --- 1. Компиляция шейдерной программы ---
        const vs = gl.createShader(gl.VERTEX_SHADER);
        if (!vs) {
            console.error("Не удалось создать vertex шейдер");
            return;
        }
        gl.shaderSource(vs, vsSourceTexture);
        gl.compileShader(vs);
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            console.error("Ошибка компиляции vertex шейдера:", gl.getShaderInfoLog(vs));
            gl.deleteShader(vs);
            return;
        }

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        if (!fs) {
            console.error("Не удалось создать fragment шейдер");
            return;
        }
        gl.shaderSource(fs, fsSourceTexture);
        gl.compileShader(fs);
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            console.error("Ошибка компиляции fragment шейдера:", gl.getShaderInfoLog(fs));
            gl.deleteShader(fs);
            return;
        }

        program = gl.createProgram();
        if (!program) {
            console.error("Не удалось создать шейдерную программу");
            gl.deleteShader(vs);
            gl.deleteShader(fs);
            return;
        }

        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Ошибка линковки программы:", gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            program = null;
            return;
        }

        // Удаляем шейдеры — они уже не нужны
        gl.deleteShader(vs);
        gl.deleteShader(fs);

        // --- 2. Создание буферов ---
        const trapezoid = createTrapezoidWithTexCoords();

        positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(trapezoid.positions), gl.STATIC_DRAW);

        texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(trapezoid.texCoords), gl.STATIC_DRAW);

        indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(trapezoid.indices), gl.STATIC_DRAW);

        // --- 3. Загрузка текстуры ---
        loadTexture(gl, IMAGE_URL, (loadedTexture) => {
            texture = loadedTexture;
            if (texture) {
                configureTexture(gl, texture, settings);
            }
        });

        // --- 4. Включаем тест глубины (на всякий случай) ---
        gl.enable(gl.DEPTH_TEST);
    },

    render(gl, sceneOptions: WebGLSceneOptionsType) {
        if (!program || !positionBuffer || !texCoordBuffer || !indexBuffer) {
            console.warn("Ресурсы не инициализированы");
            return;
        }

        // --- 1. Очистка экрана ---
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // --- 2. Настройка матриц ---
        const projectionMatrix = mat4.create();
        const modelViewMatrix = mat4.create();

        const aspect = gl.canvas.width / gl.canvas.height;
        // Ортографическая проекция — лучше для 2D/полу-3D
        mat4.ortho(projectionMatrix, -aspect, aspect, -1, 1, 0.1, 100);

        // Видовая матрица: камера сзади
        mat4.lookAt(
            modelViewMatrix,
            [0, 0, 5],  // камера
            [0, 0, 0],  // центр
            [0, 1, 0]   // вверх
        );

        // --- 3. Активируем программу ---
        gl.useProgram(program);

        // --- 4. Привязываем буфер позиций ---
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positionLocation = gl.getAttribLocation(program, "aPosition");
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLocation);

        // --- 5. Привязываем буфер текстурных координат ---
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        const texCoordLocation = gl.getAttribLocation(program, "aTexCoord");
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texCoordLocation);

        // --- 6. Привязываем индексный буфер ---
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // --- 7. Настройка текстуры ---
        if (texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
        }

        // --- 8. Передаём uniform'ы ---
        const projectionMatrixLocation = gl.getUniformLocation(program, "uProjectionMatrix");
        const modelViewMatrixLocation = gl.getUniformLocation(program, "uModelViewMatrix");
        const useTextureLocation = gl.getUniformLocation(program, "uUseTexture");

        gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLocation, false, modelViewMatrix);
        gl.uniform1i(useTextureLocation, settings.useTexture ? 1 : 0); // bool → int

        // --- 9. Рисуем трапецию ---
        const indexCount = 6; // 2 треугольника
        gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
    },

    dispose(gl) {
        if (program) gl.deleteProgram(program);
        if (positionBuffer) gl.deleteBuffer(positionBuffer);
        if (texCoordBuffer) gl.deleteBuffer(texCoordBuffer);
        if (indexBuffer) gl.deleteBuffer(indexBuffer);
        if (texture) gl.deleteTexture(texture);

        program = null;
        positionBuffer = null;
        texCoordBuffer = null;
        indexBuffer = null;
        texture = null;
    },
};
