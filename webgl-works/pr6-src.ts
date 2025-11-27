import { mat3, mat4, vec3 } from "gl-matrix";

const globals =  {
    maxTask: 1,
    sphereRadius: 3.0,
    material1: {
        ambient:  [0.25, 0.20725, 0.20725] as [number, number, number],
        diffuse:  [1.0, 0.829, 0.829] as [number, number, number],
        specular: [0.296648, 0.296648, 0.296648] as [number, number, number],
        shininess: 0.088
    },
    material2: {
        ambient:  [0.0, 0.0, 0.0] as [number, number, number],
        diffuse:  [0.1, 0.35, 0.1] as [number, number, number],
        specular: [0.45, 0.55, 0.45] as [number, number, number],
        shininess: 0.25
    }
}

// ... предыдущий код ...
/*
export const vsSourceLighting = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

out vec3 vNormal;
out vec3 vPosition;

void main() {
    vNormal = normalize(uNormalMatrix * aNormal);
    vPosition = vec3(uModelViewMatrix * vec4(aPosition, 1.0));
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
`;

export const fsSourceLighting = `#version 300 es
precision mediump float;

in vec3 vNormal;
in vec3 vPosition;

out vec4 fragColor;

void main() {
    // Цвет света
    vec3 lightColor = vec3(1, 1, 1);
    
    vec3 lightDir = normalize(vec3(-1.0, -1.0, 0.0));
    
    // Нормаль (уже в видовом пространстве)
    vec3 normal = normalize(vNormal);
    
    // Диффузное освещение (Lambert)
    float diff = max(dot(normal, -lightDir), 0.0);
    
    // Итоговый цвет
    vec3 result = lightColor * diff;
    
    fragColor = vec4(result, 1.0);
}
`;
*/

export const vsSourcePhong = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

out vec3 vNormal;
out vec3 vPosition;

void main() {
    vNormal = normalize(uNormalMatrix * aNormal);
    vPosition = vec3(uModelViewMatrix * vec4(aPosition, 1.0));
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
`;

export const fsSourcePhong = `#version 300 es
precision mediump float;

// Направленный свет
uniform vec3 uLightDir;       // Направление света (в видовом пространстве)
uniform vec3 uLightColor;     // Цвет света

// Материал
uniform vec3 uAmbient;
uniform vec3 uDiffuse;
uniform vec3 uSpecular;
uniform float uShininess;

in vec3 vNormal;
in vec3 vPosition;

out vec4 fragColor;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(-vPosition);  // Вид из камеры (в видовом пространстве)
    vec3 reflectDir = reflect(-uLightDir, normal);

    // Ambient
    vec3 ambient = uAmbient * uLightColor;

    // Diffuse
    float diff = max(dot(normal, uLightDir), 0.0);
    vec3 diffuse = diff * uDiffuse * uLightColor;

    // Specular
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
    vec3 specular = spec * uSpecular * uLightColor;

    vec3 result = ambient + diffuse + specular;
    fragColor = vec4(result, 1.0);
}
`;


function createSphere(radius: number, segments: number = 16): {
  vertices: number[],
  vertexNormals: number[],
  indices: number[]
} {
  const vertices: number[] = [];
  const vertexNormals: number[] = [];
  const indices: number[] = [];
  
  for (let lat = 0; lat <= segments; lat++) {
    const theta = lat * Math.PI / segments;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    
    for (let lon = 0; lon <= segments; lon++) {
      const phi = lon * 2 * Math.PI / segments;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      
      // Позиция вершины
      const x = cosPhi * sinTheta * radius;
      const y = cosTheta * radius;
      const z = sinPhi * sinTheta * radius;
      
      vertices.push(x, y, z);
      
      // Нормаль = нормализованный вектор от центра к вершине
      vertexNormals.push(x / radius, y / radius, z / radius);
    }
  }
  
  // Индексы (без изменений)
  for (let lat = 0; lat < segments; lat++) {
    for (let lon = 0; lon < segments; lon++) {
      const first = lat * (segments + 1) + lon;
      const second = first + segments + 1;
      
      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }
  
  return { vertices, vertexNormals, indices };
}

function setupModelBuffers(
    gl: WebGLRenderingContext,
    model: {
        vertices: number[];
        vertexNormals: number[];
        indices: number[];
    }
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

function createShaderProgram(gl: WebGL2RenderingContext): WebGLProgram {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSourcePhong);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSourcePhong);

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

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
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

/*function renderModel(
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
    normalMatrix: mat3
): void {
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, 'aPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    const normalLocation = gl.getAttribLocation(program, 'aNormal');
    if (normalLocation >= 0 && buffers.normalBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
        gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normalLocation);
    }

    const modelViewMatrixLocation = gl.getUniformLocation(program, 'uModelViewMatrix');
    const projectionMatrixLocation = gl.getUniformLocation(program, 'uProjectionMatrix');
    const normalMatrixLocation = gl.getUniformLocation(program, 'uNormalMatrix');

    gl.uniformMatrix4fv(modelViewMatrixLocation, false, modelViewMatrix);
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
    gl.uniformMatrix3fv(normalMatrixLocation, false, normalMatrix);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
    gl.drawElements(gl.TRIANGLES, buffers.vertexCount, gl.UNSIGNED_SHORT, 0);
}*/

function renderModel(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    buffers: { vertexBuffer: WebGLBuffer; normalBuffer: WebGLBuffer | null; indexBuffer: WebGLBuffer; vertexCount: number; },
    modelViewMatrix: mat4,
    projectionMatrix: mat4,
    normalMatrix: mat3,
    material: any,
    lightDirView: vec3
) {
    gl.useProgram(program);

    const posLoc = gl.getAttribLocation(program, 'aPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    const normLoc = gl.getAttribLocation(program, 'aNormal');
    if (normLoc >= 0 && buffers.normalBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
        gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normLoc);
    }

    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uModelViewMatrix'), false, modelViewMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uProjectionMatrix'), false, projectionMatrix);
    gl.uniformMatrix3fv(gl.getUniformLocation(program, 'uNormalMatrix'), false, normalMatrix);

    gl.uniform3fv(gl.getUniformLocation(program, 'uLightDir'), lightDirView);
    gl.uniform3fv(gl.getUniformLocation(program, 'uLightColor'), [0.5, 0.3, 0.5]);

    gl.uniform3fv(gl.getUniformLocation(program, 'uAmbient'), material.ambient);
    gl.uniform3fv(gl.getUniformLocation(program, 'uDiffuse'), material.diffuse);
    gl.uniform3fv(gl.getUniformLocation(program, 'uSpecular'), material.specular);
    gl.uniform1f(gl.getUniformLocation(program, 'uShininess'), material.shininess);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
    gl.drawElements(gl.TRIANGLES, buffers.vertexCount, gl.UNSIGNED_SHORT, 0);
}


// Вспомогательная функция нормализации
function normalize(v: number[]): number[] {
    const length = Math.hypot(...v);
    return v.map(n => n / length);
}


export{
    globals,
    createSphere,
    setupModelBuffers,
    createShaderProgram,
    renderModel
}