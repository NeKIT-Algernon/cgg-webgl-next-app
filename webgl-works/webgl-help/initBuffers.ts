// 
// Инициализация буферов
// Функции взяты из MDN раздела про WebGL 08/11/25
// positionBuffer - обязателен
// colorBuffer - не обязателен (null)
//
function initBuffers(gl: WebGL2RenderingContext, positions: number[], colors?: number[]) {
  const positionBuffer = initPositionBuffer(gl, positions);
  const colorBuffer = (colors) ? (initColorBuffer(gl, colors)) : (null);
  return {
    position: positionBuffer,
    color: colorBuffer,
  };
}

function initPositionBuffer(gl: WebGL2RenderingContext, positions: number[]) {
  // Create a buffer for the square's positions.
  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return positionBuffer;
}

function initColorBuffer(gl: WebGL2RenderingContext, colors: number[]) {
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  return colorBuffer;
}

export { initBuffers };