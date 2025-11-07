import { mat4 } from "gl-matrix";

const defaultSettings: WebGLcustomSettings = {
  primitive: 5,
  pointSize: 10,
  lineThickness: 10,
};

// Абстракция, которая объединяет очистку и рендер изображения
// Количество выводимых фигур определяется как наименьший из размеров двух массивов из renderInfo
function renderAll(gl: WebGL2RenderingContext, renderInfo: WebGLRenderInfo, customSettings?: Partial<WebGLcustomSettings>){
    
    const finalSettings: WebGLcustomSettings = {
        ...defaultSettings,
        ...customSettings
    };

    if (finalSettings.primitive > 6 || finalSettings.primitive < 0) finalSettings.primitive = 5;
    clearScene(gl);
    for (let i =0; i < ((renderInfo.buffersList.length < renderInfo.programInfoList.length) ? renderInfo.buffersList.length :  renderInfo.programInfoList.length); i++){
        drawScene(gl, renderInfo.programInfoList[i], renderInfo.buffersList[i], finalSettings);
    }
}

// Основной рендер приложения
function drawScene(
    gl: WebGL2RenderingContext, 
    programInfo: WebGLProgramInfo, 
    buffers: WebGLBuffersInfo, 
    { primitive, pointSize, lineThickness }: WebGLcustomSettings
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

  {
    const offset = 0;
    const vertexCount = programInfo.vertexCount;
    
    // Включение сглаживания
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const pointSizeLocation = gl.getUniformLocation(programInfo.program, "uPointSize");
    gl.uniform1f(pointSizeLocation, pointSize); 

    gl.drawArrays(primitive, offset, vertexCount);
  }
}

// Tell WebGL how to pull out the positions from the position
// buffer into the vertexPosition attribute.
function setPositionAttribute(gl: WebGL2RenderingContext, buffers: WebGLBuffersInfo, programInfo: WebGLProgramInfo) {
  const numComponents = 3; // pull out 2 values per iteration
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
function setColorAttribute(gl: WebGL2RenderingContext, buffers: WebGLBuffersInfo, programInfo: WebGLProgramInfo) {
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

function clearScene(gl: WebGL2RenderingContext){
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
  gl.clearDepth(1.0); // Clear everything
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // Set the size of canvas

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

export { renderAll }