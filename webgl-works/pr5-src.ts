import { mat4 } from "gl-matrix";
import { Mesh } from "webgl-obj-loader";

const globals = {
    maxTask: 1,
    fov: Math.PI / 6, // Угол вертикального обзора
    near: 6, // Расстояние до передней плоскости отсечения
    far: 12, // Расстояние до задней плоскости отсечения
}

// Вершинный шейдер для 3D моделей
export const vsSource3D = `#version 300 es
in vec4 aVertexPosition;
in vec3 aVertexNormal;
in vec2 aTextureCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uTransformMatrix;

out vec3 vNormal;
out vec2 vTextureCoord;
out vec3 vFragPos;

void main() {
    vNormal = aVertexNormal;
    vTextureCoord = aTextureCoord;
    vFragPos = vec3(uModelViewMatrix * uTransformMatrix * aVertexPosition);
    gl_Position = uProjectionMatrix * uModelViewMatrix * uTransformMatrix * aVertexPosition;
}`;

// Фрагментный шейдер (базовый, без освещения)
export const fsSourceModel = `#version 300 es
precision mediump float;

in vec3 vNormal;
in vec2 vTextureCoord;
in vec3 vFragPos;

out vec4 fragColor;

void main() {
    // Простое затенение по нормалям для визуализации формы
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float diff = max(dot(normalize(vNormal), lightDir), 0.3);
    
    // Можно заменить на цвет из варианта или текстуры
    vec3 objectColor = vec3(0.5, 0.2, 0.1); // Коричневый для тележки
    
    fragColor = vec4(objectColor * diff, 1.0);
}`;

const fsSourceRed = `#version 300 es
precision mediump float;
out vec4 fragColor;

void main() {
    fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`;

const vsSource = `#version 300 es
    in vec4 aVertexPosition;
    in vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uTransformMatrix;
    uniform float uPointSize;

    flat out vec4 vColor;

    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * uTransformMatrix  * aVertexPosition;
        gl_PointSize = uPointSize;
        vColor = aVertexColor;
    }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Не удалось создать шейдер');

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error('Ошибка компиляции шейдера: ' + error);
    }

    return shader;
}

function createShaderProgram(gl: WebGLRenderingContext): WebGLProgram {
    // Вершинный шейдер
    const vsSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat3 uNormalMatrix;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vNormal = uNormalMatrix * aNormal;
      vPosition = vec3(uModelViewMatrix * vec4(aPosition, 1.0));
      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
    }
  `;

    // Фрагментный шейдер
const fsSource = `
    precision mediump float;
    
    void main() {
      gl_FragColor = vec4(0.7, 0.7, 0.8, 1.0);
    }
  `;

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const program = gl.createProgram();
    if (!program) throw new Error('Не удалось создать шейдерную программу');

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const error = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error('Ошибка линковки шейдерной программы: ' + error);
    }

    return program;
}

function setupModelBuffers(
    gl: WebGLRenderingContext,
    model: Mesh
): {
    vertexBuffer: WebGLBuffer;
    normalBuffer: WebGLBuffer | null;
    indexBuffer: WebGLBuffer;
    vertexCount: number;
} {
    const vertices = model.vertices;
    const normals = model.vertexNormals;
    const indices = model.indices;

    // Создаем буфер для вершин
    const vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) throw new Error('Не удалось создать буфер вершин');

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Создаем буфер для нормалей (если есть)
    let normalBuffer: WebGLBuffer | null = null;
    if (normals && normals.length > 0) {
        normalBuffer = gl.createBuffer();
        if (!normalBuffer) throw new Error('Не удалось создать буфер нормалей');

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    }

    // Создаем буфер для индексов
    const indexBuffer = gl.createBuffer();
    if (!indexBuffer) throw new Error('Не удалось создать индексный буфер');

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        vertexBuffer,
        normalBuffer,
        indexBuffer,
        vertexCount: indices.length
    };
}

function renderModel(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    buffers: {
        vertexBuffer: WebGLBuffer;
        normalBuffer: WebGLBuffer | null;
        indexBuffer: WebGLBuffer;
        vertexCount: number;
    },
    modelViewMatrix: mat4,
    projectionMatrix: mat4,
    normalMatrix: Float32Array
): void {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    gl.useProgram(program);

    // Устанавливаем атрибуты вершин
    const positionLocation = gl.getAttribLocation(program, 'aPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    // Устанавливаем атрибуты нормалей (если есть)
    const normalLocation = gl.getAttribLocation(program, 'aNormal');
    if (normalLocation >= 0 && buffers.normalBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
        gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normalLocation);
    }

    // Устанавливаем uniform переменные
    const modelViewMatrixLocation = gl.getUniformLocation(program, 'uModelViewMatrix');
    const projectionMatrixLocation = gl.getUniformLocation(program, 'uProjectionMatrix');
    const normalMatrixLocation = gl.getUniformLocation(program, 'uNormalMatrix');

    gl.uniformMatrix4fv(modelViewMatrixLocation, false, modelViewMatrix);
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
    gl.uniformMatrix3fv(normalMatrixLocation, false, normalMatrix);

    // Рисуем модель
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
    //gl.drawArrays(gl.TRIANGLES, 0, buffers.vertexCount);
    gl.drawElements(gl.TRIANGLES, buffers.vertexCount, gl.UNSIGNED_SHORT, 0);
}

export {
    globals,
    fsSourceRed,
    vsSource,
    createShaderProgram,
    setupModelBuffers,
    renderModel,
}