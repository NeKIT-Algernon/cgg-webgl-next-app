// ... импорты те же ...
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

const BASE_TEXTURE_URL = "/textures/sample.jpg";
const SPECULAR_MAP_URL = "/textures/sample_specular.jpg"; // ← должна лежать в public/textures/

let program: WebGLProgram | null = null;
let positionBuffer: WebGLBuffer | null = null;
let texCoordBuffer: WebGLBuffer | null = null;
let indexBuffer: WebGLBuffer | null = null;
let baseTexture: WebGLTexture | null = null;
let specularTexture: WebGLTexture | null = null;
let settings = {
    useSpecular: true,
};

export const PR7: WorkType = {
    id: "7",
    name: "Практика № 7",
    controls: [
        "E - вкл/выкл карта отражений (specular map)",
        "R - вращение трапеции вокруг оси Y",
    ],

    keyHandler: (event: KeyboardEvent, sceneOptions: WebGLSceneOptionsType) => {
        switch (event.code) {
            case "KeyE":
                settings.useSpecular = !settings.useSpecular;
                console.log("Карта отражений:", settings.useSpecular ? "включена" : "выключена");
                sceneOptions.changed = (sceneOptions.changed || 0) + 1;
                break;

            case "KeyR":
                sceneOptions.angle = (sceneOptions.angle || 0) + 5;
                if (sceneOptions.angle >= 360) sceneOptions.angle -= 360;
                console.log("Вращение вокруг Y: угол =", sceneOptions.angle);
                sceneOptions.changed = (sceneOptions.changed || 0) + 1;
                break;
        }
    },

    initialize(gl, sceneOptions: WebGLSceneOptionsType) {
        // --- 1. Компиляция шейдеров ---
        const vs = gl.createShader(gl.VERTEX_SHADER);
        if (!vs) return console.error("Не удалось создать vertex шейдер");
        gl.shaderSource(vs, vsSourceTexture);
        gl.compileShader(vs);
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            console.error("Ошибка компиляции VS:", gl.getShaderInfoLog(vs));
            gl.deleteShader(vs);
            return;
        }

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        if (!fs) return console.error("Не удалось создать fragment шейдер");
        gl.shaderSource(fs, fsSourceTexture);
        gl.compileShader(fs);
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            console.error("Ошибка компиляции FS:", gl.getShaderInfoLog(fs));
            gl.deleteShader(fs);
            return;
        }

        program = gl.createProgram();
        if (!program) return;
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Ошибка линковки:", gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return;
        }

        gl.deleteShader(vs);
        gl.deleteShader(fs);

        // --- 2. Буферы ---
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

        // --- 3. Загрузка текстур ---
        loadTexture(gl, BASE_TEXTURE_URL, (tex) => {
            baseTexture = tex;
            const canvas = gl.canvas as HTMLCanvasElement;
            canvas.dispatchEvent(new CustomEvent("textureloaded"));
        });

        loadTexture(gl, SPECULAR_MAP_URL, (tex) => {
            specularTexture = tex;
            const canvas = gl.canvas as HTMLCanvasElement;
            canvas.dispatchEvent(new CustomEvent("textureloaded"));
        });

        gl.enable(gl.DEPTH_TEST);
    },

    render(gl, sceneOptions: WebGLSceneOptionsType) {
        console.log("Render PR7");
        if (!program || !positionBuffer || !texCoordBuffer || !indexBuffer || !baseTexture || !specularTexture) {
            console.warn("Ресурсы не инициализированы");
            return;
        }

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Матрицы
        const projectionMatrix = mat4.create();
        const modelViewMatrix = mat4.create();
        const aspect = gl.canvas.width / gl.canvas.height;
        mat4.ortho(projectionMatrix, -aspect, aspect, -1, 1, 0.1, 100);
        mat4.lookAt(modelViewMatrix, [0, 0, 5], [0, 0, 0], [0, 1, 0]);
        mat4.rotate(modelViewMatrix, modelViewMatrix, (sceneOptions.angle || 0) * (Math.PI / 180), [0, 1, 0]);

        // Используем программу
        gl.useProgram(program);

        // Позиции
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positionLoc = gl.getAttribLocation(program, "aPosition");
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLoc);

        // Текстурные координаты
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        const texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texCoordLoc);

        // Индексы
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // Текстуры: unit 0 — основная, unit 1 — карта отражений
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, baseTexture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, specularTexture);

        // Uniform'ы
        const projLoc = gl.getUniformLocation(program, "uProjectionMatrix");
        const mvLoc = gl.getUniformLocation(program, "uModelViewMatrix");
        const useSpecularLoc = gl.getUniformLocation(program, "uUseSpecular");
        const samplerLoc = gl.getUniformLocation(program, "uSampler");
        const specularMapLoc = gl.getUniformLocation(program, "uSpecularMap");

        gl.uniformMatrix4fv(projLoc, false, projectionMatrix);
        gl.uniformMatrix4fv(mvLoc, false, modelViewMatrix);
        gl.uniform1i(useSpecularLoc, settings.useSpecular ? 1 : 0);
        gl.uniform1i(samplerLoc, 0);           // TEXTURE0
        gl.uniform1i(specularMapLoc, 1);       // TEXTURE1

        // Рисуем
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    },

    dispose(gl) {
        // Удаляем WebGL-ресурсы
        if (program) gl.deleteProgram(program);
        if (positionBuffer) gl.deleteBuffer(positionBuffer);
        if (texCoordBuffer) gl.deleteBuffer(texCoordBuffer);
        //if (normalBuffer) gl.deleteBuffer(normalBuffer);
        if (indexBuffer) gl.deleteBuffer(indexBuffer);
        if (baseTexture) gl.deleteTexture(baseTexture);
        if (specularTexture) gl.deleteTexture(specularTexture);

        // === Сбрасываем состояние WebGL ===
        // ОтключаемVertexAttribArray для всех, что мы включали
        const positionLoc = gl.getAttribLocation(program!, "aPosition");
        const texCoordLoc = gl.getAttribLocation(program!, "aTexCoord");
        const normalLoc = gl.getAttribLocation(program!, "aNormal");

        if (positionLoc !== -1) gl.disableVertexAttribArray(positionLoc);
        if (texCoordLoc !== -1) gl.disableVertexAttribArray(texCoordLoc);
        if (normalLoc !== -1) gl.disableVertexAttribArray(normalLoc);

        // Отвязываем буферы
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        // Отвязываем текстуры
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, null);

        // Отключаем тесты
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.BLEND);

        // Сбрасываем viewport? Не обязательно, но можно
        // gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        // === Обнуляем ссылки ===
        program = null;
        positionBuffer = null;
        texCoordBuffer = null;
        indexBuffer = null;
        baseTexture = null;
        specularTexture = null;
    }
}
