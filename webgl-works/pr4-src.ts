import { baseSceneOptions } from "@/types/baseObjects";
import { WebGLBuffersInfoType, WebGLProgramInfoType, WebGLRenderInfoType, WebGLSceneOptionsType } from "@/types/webGLWork";
import { mat4 } from "gl-matrix";

const globals = {
    maxTask: 6, // Сколько заданий всего

}

const fig1 = [
    [1, 1, 0],
    [1, 0, 1],
    [0, 1, 1],
]

const fig2 = [
    [0.8, 0.7, 1],
    [-0.8, 0.7, 1],
    [-0.8, -0.7, -0.8],
    [0.8, 0.7, 1],
    [-0.8, -0.7, -0.8],
    [0.8, -0.7, -0.8]
]

const fig3 = [
    [0, 0.5, -0.5],
    [-0.5, 0, -0.5],
    [0.5, 0, 0.5]
]

const cubeVertices = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], // задняя грань
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]     // передняя грань
];

const cubeColors = [
    // Каждой грани - свой цвет
    // Задняя грань - красная
    1, 0, 0, 1,  1, 0, 0, 1,  1, 0, 0, 1,
    1, 0, 0, 1,  1, 0, 0, 1,  1, 0, 0, 1,
    
    // Передняя грань - зеленая
    0, 1, 0, 1,  0, 1, 0, 1,  0, 1, 0, 1,
    0, 1, 0, 1,  0, 1, 0, 1,  0, 1, 0, 1,
    
    // Левая грань - синяя
    0, 0, 1, 1,  0, 0, 1, 1,  0, 0, 1, 1,
    0, 0, 1, 1,  0, 0, 1, 1,  0, 0, 1, 1,
    
    // Правая грань - желтая
    1, 1, 0, 1,  1, 1, 0, 1,  1, 1, 0, 1,
    1, 1, 0, 1,  1, 1, 0, 1,  1, 1, 0, 1,
    
    // Верхняя грань - пурпурная
    1, 0, 1, 1,  1, 0, 1, 1,  1, 0, 1, 1,
    1, 0, 1, 1,  1, 0, 1, 1,  1, 0, 1, 1,
    
    // Нижняя грань - голубая
    0, 1, 1, 1,  0, 1, 1, 1,  0, 1, 1, 1,
    0, 1, 1, 1,  0, 1, 1, 1,  0, 1, 1, 1,
];

const cube = [
    cubeVertices[0], cubeVertices[1], cubeVertices[2], cubeVertices[0], cubeVertices[2], cubeVertices[3],
    cubeVertices[4], cubeVertices[5], cubeVertices[6], cubeVertices[4], cubeVertices[6], cubeVertices[7],
    cubeVertices[0], cubeVertices[3], cubeVertices[7], cubeVertices[0], cubeVertices[7], cubeVertices[4],
    cubeVertices[1], cubeVertices[2], cubeVertices[6], cubeVertices[1], cubeVertices[6], cubeVertices[5],
    cubeVertices[0], cubeVertices[1], cubeVertices[5], cubeVertices[0], cubeVertices[5], cubeVertices[4],
    cubeVertices[2], cubeVertices[3], cubeVertices[7], cubeVertices[2], cubeVertices[7], cubeVertices[6]
];
const cubeLines = [
    cubeVertices[0], cubeVertices[1],
    cubeVertices[1], cubeVertices[5],
    cubeVertices[5], cubeVertices[4],
    cubeVertices[4], cubeVertices[0],

    cubeVertices[3], cubeVertices[2],
    cubeVertices[2], cubeVertices[6],
    cubeVertices[6], cubeVertices[7],
    cubeVertices[7], cubeVertices[3],

    cubeVertices[0], cubeVertices[3],
    cubeVertices[7], cubeVertices[4],
    cubeVertices[5], cubeVertices[6],
    cubeVertices[2], cubeVertices[1],
];

// Фрагментный шейдер
const fsSourceRed = `#version 300 es
precision mediump float;
out vec4 fragColor;

void main() {
    fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`;
const fsSourceGreen = `#version 300 es
precision mediump float;
out vec4 fragColor;

void main() {
    fragColor = vec4(0.0, 1.0, 0.0, 1.0);
}
`;
const fsSourceBlue = `#version 300 es
precision mediump float;
out vec4 fragColor;

void main() {
    fragColor = vec4(0.0, 0.0, 1.0, 0.2);
}
`;

// Вершинный шейдер
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

// Фрагментный шейдер с поддержкой цвета
const fsSourceColor = `#version 300 es
    precision highp float;

    flat in vec4 vColor;
    out vec4 fragColor;

    void main() {
        fragColor = vColor;
    }
`;

function orthoDraw(gl: WebGL2RenderingContext, renderInfo: WebGLRenderInfoType, partSceneOptions?: Partial<WebGLSceneOptionsType>) {
    // Если недостаёт настроек, то вставляем базовые
    const sceneOptions: WebGLSceneOptionsType = {
        ...baseSceneOptions,
        ...partSceneOptions
    };

    // Обновляем сцену
    clearScene(gl);

    for (let i = 0; i < ((renderInfo.buffersList.length < renderInfo.programInfoList.length) ? renderInfo.buffersList.length : renderInfo.programInfoList.length); i++) {
        drawSceneSpecial(gl, renderInfo.programInfoList[i], renderInfo.buffersList[i], sceneOptions, (renderInfo.transformMatrices ? renderInfo.transformMatrices[i] : undefined));
    }
}

function drawSceneSpecial(
    gl: WebGL2RenderingContext,
    programInfo: WebGLProgramInfoType,
    buffers: WebGLBuffersInfoType,
    { primitive, pointSize, angle: lineThickness }: WebGLSceneOptionsType,
    transformMatrix?: mat4,) {

    const projectionMatrix = mat4.create();

    // Параметры параллельной проекции из задания
    const aspect = gl.canvas.width / gl.canvas.height;
    const left = (aspect > 1) ? -0.85 * aspect : -0.85;
    const right = (aspect > 1) ? 0.85 * aspect : 0.85;
    const bottom = (aspect <= 1) ? -0.7 / aspect : -0.7;
    const top = (aspect <= 1) ? 0.7 / aspect : 0.7;
    const near = 6;
    const far = 12;
    

/*let left = -2;
let right = 2;
let bottom = -2;
let top = 2;*/
/*const near = 13;
const far = 25;*/

mat4.ortho(projectionMatrix, left, right, bottom, top, near, far);

    const modelViewMatrix = mat4.create();
    const finalTransformMatrix = transformMatrix || mat4.create();

    // ВАЖНО: Измените позицию камеры - куб должен находиться между near и far
    // near=6, far=12, поэтому позиционируем куб в этом диапазоне
    mat4.translate(
        modelViewMatrix,
        modelViewMatrix,
        [0.0, 0.0, -12], // Помещаем куб на z = -8 (между 6 и 12)
    );

    // ДОПОЛНИТЕЛЬНО: Добавьте небольшой поворот чтобы видеть 3D форму
    //mat4.rotate(modelViewMatrix, modelViewMatrix, Math.PI / 6, [1, 1, 0]);

    // Остальной код без изменений...
    setPositionAttribute(gl, buffers, programInfo);
    if (buffers.color) setColorAttribute(gl, buffers, programInfo);

    gl.useProgram(programInfo.program);

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix,
    );
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix,
    );
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.transformMatrix!,
        false,
        finalTransformMatrix,
    );

    {
        const offset = 0;
        const vertexCount = programInfo.vertexCount;

        gl.disable(gl.BLEND);

        const pointSizeLocation = gl.getUniformLocation(programInfo.program, "uPointSize");
        if (pointSizeLocation) {
            gl.uniform1f(pointSizeLocation, pointSize);
        }

        gl.drawArrays(primitive, offset, vertexCount);
    }
}

export {
    globals,
    fsSourceColor,
    fsSourceRed,
    fsSourceGreen,
    fsSourceBlue,
    vsSource,
    fig1,
    fig2,
    fig3,
    cube,
    cubeLines,
    cubeColors,
    orthoDraw,
}

function clearScene(gl: WebGL2RenderingContext) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    //gl.enable(gl.DEPTH_TEST); // Enable depth testing
    //gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // Set the size of canvas

    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

// Tell WebGL how to pull out the positions from the position
// buffer into the vertexPosition attribute.
function setPositionAttribute(gl: WebGL2RenderingContext, buffers: WebGLBuffersInfoType, programInfo: WebGLProgramInfoType) {
    const numComponents = 3; // pull out 3 values per iteration
    const type = gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

// Tell WebGL how to pull out the colors from the color buffer
// into the vertexColor attribute.
function setColorAttribute(gl: WebGL2RenderingContext, buffers: WebGLBuffersInfoType, programInfo: WebGLProgramInfoType) {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    if (buffers.color) gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
}

