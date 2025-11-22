import { mat4 } from "gl-matrix";
import { baseSceneOptions } from '@/types/baseObjects';
import { WebGLBuffersInfoType, WebGLProgramInfoType, WebGLRenderInfoType, WebGLSceneOptionsType } from "@/types/webGLWork";

// Абстракция, которая объединяет очистку и рендер фигур (если их несколько)
// Количество выводимых фигур определяется как наименьший из размеров двух массивов из renderInfo
function renderAll(gl: WebGL2RenderingContext, renderInfo: WebGLRenderInfoType, partSceneOptions?: Partial<WebGLSceneOptionsType>) {

  // Если не достаёт настроек, то вставляем базовые
  const sceneOptions: WebGLSceneOptionsType = {
    ...baseSceneOptions,
    ...partSceneOptions
  };

  // Обновляем сцену
  clearScene(gl);
  // Отрисовываем каждую фигуру, данные о которой получаем
  for (let i = 0; i < ((renderInfo.buffersList.length < renderInfo.programInfoList.length) ? renderInfo.buffersList.length : renderInfo.programInfoList.length); i++) {
    drawScene(gl, renderInfo.programInfoList[i], renderInfo.buffersList[i], sceneOptions, (renderInfo.transformMatrices ? renderInfo.transformMatrices[i] : undefined));
  }
}

// Рендер одной фигуры. Практически полностью взято из MDN раздела про WebGL 08/11/25
// Добавлено сглаживание и кастомный размер точек
function drawScene(
  gl: WebGL2RenderingContext,
  programInfo: WebGLProgramInfoType,
  buffers: WebGLBuffersInfoType,
  { primitive, pointSize }: WebGLSceneOptionsType,
  transformMatrix?: mat4,
) {

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = (45 * Math.PI) / 180; // in radians
  const aspect = gl.canvas.width / gl.canvas.height;
  const zNear = 0.1;
  const zFar = 100.0;
   
  const projectionMatrix = mat4.create();

  // note: glMatrix always has the first argument
  // as the destination to receive the result.

  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  const finalTransformMatrix = transformMatrix || mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.
  mat4.translate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to translate
    [0.0, 0.0, -2.0],
  ); // amount to translate

  // Tell WebGL how to pull out the positions and colors from the position and color
  // buffer into the vertexPosition and vertexColor attribute.
  setPositionAttribute(gl, buffers, programInfo);
  if (buffers.color) setColorAttribute(gl, buffers, programInfo);

  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);

  // Set the shader uniforms
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
    (programInfo.uniformLocations.transformMatrix) ? programInfo.uniformLocations.transformMatrix : mat4.create(),
    false,
    finalTransformMatrix,
  );

  {
    const offset = 0;
    const vertexCount = programInfo.vertexCount;

    // Включение сглаживания
    // Для точек включаем blending для сглаживания
    if (primitive === gl.POINTS) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    } else {
      // Для линий и других примитивов отключаем blending
      gl.disable(gl.BLEND);
    }

    // Кастомный размер точки через шейдер
    const pointSizeLocation = gl.getUniformLocation(programInfo.program, "uPointSize");
    gl.uniform1f(pointSizeLocation, pointSize);

    gl.drawArrays(primitive, offset, vertexCount);
  }
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

function clearScene(gl: WebGL2RenderingContext) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
  gl.clearDepth(1.0); // Clear everything
  //gl.enable(gl.DEPTH_TEST); // Enable depth testing
  //gl.depthFunc(gl.LEQUAL); // Near things obscure far things
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // Set the size of canvas

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

export { renderAll, drawScene }