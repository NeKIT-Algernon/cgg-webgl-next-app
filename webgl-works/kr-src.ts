// webgl-works/kr-src.ts
import { mat4, mat3, vec3 } from "gl-matrix";
import { WebGLSceneOptionsType } from "@/types/webGLWork";

/// === Типы ===

export type GLTFModelPart = {
  vertices: number[];
  normals: number[];
  texCoords: number[];
  indices: number[];
  textureData: ArrayBuffer | null;
  mimeType: string;
};

export type GLTFModel = {
  parts: GLTFModelPart[];
};

export type RenderModelPartBuffers = {
  vertex: WebGLBuffer;
  normal: WebGLBuffer | null;
  texCoord: WebGLBuffer | null;
  index: WebGLBuffer;
  count: number;
  indexType: number;
};

export type RenderModelPart = {
  buffers: RenderModelPartBuffers;
  texture: WebGLTexture;
};

export type RenderModelType = {
  parts: RenderModelPart[];
  program: WebGLProgram;
  modelMatrix: mat4;
};

let globalCarrot: RenderModelType | null = null;



// === Шейдеры ===
export const vsSourceModel = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

out vec3 vNormal;
out vec2 vTexCoord;
out vec3 vPosition;

void main() {
    vNormal = uNormalMatrix * aNormal;
    vTexCoord = aTexCoord;
    vPosition = vec3(uModelViewMatrix * vec4(aPosition, 1.0));
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
`;

export const fsSourceModel = `#version 300 es
precision mediump float;

in vec3 vNormal;
in vec2 vTexCoord;
in vec3 vPosition;

uniform sampler2D uSampler;
uniform vec3 uLightColor;

out vec4 fragColor;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float diff = max(dot(normal, lightDir), 0.3);
    
    // Читаем цвет из текстуры
    vec4 texColor = texture(uSampler, vTexCoord);
    
    // Умножаем на диффузное освещение
    fragColor = vec4(texColor.rgb * diff * uLightColor, texColor.a);
}
`;


// === Глобальные данные сцены ===
let boilerModel: GLTFModel | null = null;
let carrotModel: GLTFModel | null = null;
const MAX_BUBBLES = 20;

// === Инициализация ===
// kr-src.ts

export async function initializeScene(
  gl: WebGL2RenderingContext,
  sceneOptions: WebGLSceneOptionsType
) {
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  try {
    const model = await loadGLB("/models/carrot.glb");

    const program = createShaderProgram(gl, vsSourceModel, fsSourceModel);

    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, [0, 0, 0]);
    mat4.scale(modelMatrix, modelMatrix, [1, 1, 1]);

    const parts: RenderModelPart[] = [];

    for (const part of model.parts) {
      const buffers = setupModelPartBuffers(gl, part);
      const texture = part.textureData
        ? await createTextureFromData(gl, part.textureData, part.mimeType)
        : createPlaceholderTexture(gl, 255, 0, 255);

      parts.push({ buffers, texture });
    }

    globalCarrot = {
      parts,
      program,
      modelMatrix,
    };

    sceneOptions.ready = true;

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.dispatchEvent(new CustomEvent("sceneready"));

    console.log(" ModelRenderer: модель и текстуры загружены, globalCarrot установлен");
  } catch (e) {
    console.error("Ошибка инициализации:", e);
  }
}


function createTextureFromData(
  gl: WebGL2RenderingContext,
  data: ArrayBuffer,
  mimeType: string
): Promise<WebGLTexture> {
  return new Promise((resolve) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const image = new Image();
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

      URL.revokeObjectURL(url);
      resolve(texture);
    };

    image.onerror = () => {
      console.error("Failed to load texture image");
      URL.revokeObjectURL(url);
      resolve(createPlaceholderTexture(gl, 255, 0, 255));
    };

    image.src = url;
  });
}



function createPlaceholderTexture(
  gl: WebGL2RenderingContext,
  r: number,
  g: number,
  b: number
): WebGLTexture {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  const pixel = new Uint8Array([r, g, b, 255]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
  return texture;
}


// === Рендер ===
// kr-src.ts

export function renderScene(
  gl: WebGL2RenderingContext,
  sceneOptions: WebGLSceneOptionsType
) {
  if (!sceneOptions.ready || !globalCarrot) {
    return;
  }

  const { program, parts, modelMatrix } = globalCarrot;

  const projectionMatrix = mat4.create();
  const viewMatrix = mat4.create();
  const modelViewMatrix = mat4.create();
  const normalMatrix = mat3.create();

  const aspect = gl.canvas.width / gl.canvas.height;
  mat4.perspective(projectionMatrix, (45 * Math.PI) / 180, aspect, 0.1, 100);
  mat4.lookAt(viewMatrix, [5, 3, 45], [0, 0, 0], [0, 1, 0]);
  mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
  mat3.normalFromMat4(normalMatrix, modelViewMatrix);

  gl.clearColor(0.1, 0.1, 0.1, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(program);

  // === Общие uniform'ы, не зависящие от части ===
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjectionMatrix"), false, projectionMatrix);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModelViewMatrix"), false, modelViewMatrix);
  gl.uniformMatrix3fv(gl.getUniformLocation(program, "uNormalMatrix"), false, normalMatrix);
  gl.uniform3fv(gl.getUniformLocation(program, "uLightColor"), [1.0, 0.9, 0.7]);

  for (const part of parts) {
    const { buffers, texture } = part;

    // === Атрибуты ===
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex);
    const posLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    if (buffers.normal) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
      const normLoc = gl.getAttribLocation(program, "aNormal");
      gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(normLoc);
    }

    if (buffers.texCoord) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoord);
      const texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
      gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(texCoordLoc);
    }

    // === Текстура ===
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, "uSampler"), 0);

    // === Рисуем эту часть ===
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
    gl.drawElements(gl.TRIANGLES, buffers.count, buffers.indexType, 0);
  }
}




// === Обработка клавиш ===
export function keyHandler(
  event: KeyboardEvent,
  sceneOptions: WebGLSceneOptionsType
) {
  // Управление позицией морковки: W, A, S, D
  // E — имитация "погружения" → генерация пузырьков
  // R — сброс
}

// === Очистка ===
export function disposeScene(gl: WebGL2RenderingContext) {
  // Удаление программ, буферов, текстур
  // Сброс ссылок
}

// === Вспомогательные функции (пока заглушки) ===

// kr-src.ts

// kr-src.ts

export function setupModelPartBuffers(
  gl: WebGL2RenderingContext,
  part: GLTFModelPart
): RenderModelPartBuffers {
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(part.vertices), gl.STATIC_DRAW);

  const normalBuffer = gl.createBuffer();
  let normalBufferData: WebGLBuffer | null = null;
  if (part.normals.length > 0) {
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(part.normals), gl.STATIC_DRAW);
    normalBufferData = normalBuffer;
  }

  const texCoordBuffer = gl.createBuffer();
  let texCoordBufferData: WebGLBuffer | null = null;
  if (part.texCoords.length > 0) {
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(part.texCoords), gl.STATIC_DRAW);
    texCoordBufferData = texCoordBuffer;
  }

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  const IndexArrayType = part.indices.every(i => i < 65536) ? Uint16Array : Uint32Array;
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new IndexArrayType(part.indices), gl.STATIC_DRAW);

  return {
    vertex: vertexBuffer,
    normal: normalBufferData,
    texCoord: texCoordBufferData,
    index: indexBuffer,
    count: part.indices.length,
    indexType: IndexArrayType === Uint16Array ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT,
  };
}





function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("Compile failed: " + log);
  }

  return shader;
}

export function createShaderProgram(
  gl: WebGL2RenderingContext,
  vsSource: string,
  fsSource: string
): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");

  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error("Link failed: " + log);
  }

  gl.deleteShader(vs);
  gl.deleteShader(fs);

  return program;
}

export function spawnBubble() {
  // Добавляет новый пузырёк в массив
}

export function updateBubbles(deltaTime: number) {
  // Обновляет позиции и время жизни пузырьков
}

// webgl-works/kr-src.ts

/**
 * Загружает и парсит GLB-файл, возвращает модель с vertices, normals, indices
 */
// kr-src.ts

// kr-src.ts

export async function loadGLB(url: string): Promise<GLTFModel> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Не удалось загрузить GLB: ${url}`);

  const arrayBuffer = await response.arrayBuffer();
  const dataView = new DataView(arrayBuffer);

  let offset = 0;

  // === Проверка заголовка ===
  const magic = readUint32(dataView, offset, true); offset += 4;
  if (magic !== 0x46546C67) throw new Error("Неверный формат: не GLB");
  const version = readUint32(dataView, offset, true); offset += 4;
  if (version !== 2) throw new Error("Поддерживается только GLB версии 2");
  offset += 4; // length

  // === Чтение chunks ===
  let jsonChunk: string | null = null;
  let binChunkData: ArrayBuffer | null = null;

  while (offset < arrayBuffer.byteLength) {
    const chunkLength = readUint32(dataView, offset, true); offset += 4;
    const chunkType = readUint32(dataView, offset, true); offset += 4;
    const chunkEnd = offset + chunkLength;

    if (chunkType === 0x4E4F534A) {
      const jsonBytes = new Uint8Array(arrayBuffer, offset, chunkLength);
      jsonChunk = new TextDecoder().decode(jsonBytes);
    } else if (chunkType === 0x004E4942) {
      binChunkData = arrayBuffer.slice(offset, chunkEnd);
    }

    offset = chunkEnd;
    while (offset % 4 !== 0) offset++;
  }

  if (!jsonChunk) throw new Error("GLB: не найден JSON chunk");
  if (!binChunkData) throw new Error("GLB: не найден бинарный chunk");

  const json = JSON.parse(jsonChunk);
  const bufferViews = json.bufferViews || [];
  const accessors = json.accessors || [];
  const images = json.images || [];
  const textures = json.textures || [];
  const materials = json.materials || [];

  const parts: GLTFModelPart[] = [];

  for (const mesh of json.meshes || []) {
    for (const prim of mesh.primitives || []) {
      const posAccessorIdx = prim.attributes.POSITION;
      if (posAccessorIdx === undefined) continue;

      const posAccessor = accessors[posAccessorIdx];
      const { array: posArray } = getAccessorData(dataView, posAccessor, bufferViews, binChunkData);
      const positions = Array.from(posArray);

      const normals: number[] = prim.attributes.NORMAL !== undefined
        ? Array.from(getAccessorData(dataView, accessors[prim.attributes.NORMAL], bufferViews, binChunkData).array)
        : new Array(positions.length).fill(0);

      const texCoords: number[] = prim.attributes.TEXCOORD_0 !== undefined
        ? Array.from(getAccessorData(dataView, accessors[prim.attributes.TEXCOORD_0], bufferViews, binChunkData).array)
        : new Array(positions.length / 3 * 2).fill(0);

      const indices: number[] = prim.indices !== undefined
        ? Array.from(getAccessorData(dataView, accessors[prim.indices], bufferViews, binChunkData).array)
        : [];

      // === Извлечение текстуры по material ===
let textureData: ArrayBuffer | null = null;
let mimeType = "image/png";

if (prim.material !== undefined) {
  const material = materials[prim.material];
  console.log("Material:", material);

  if (material?.pbrMetallicRoughness?.baseColorTexture) {
    const textureInfo = material.pbrMetallicRoughness.baseColorTexture;
    console.log("Найдена baseColorTexture:", textureInfo);

    const texture = textures[textureInfo.index];
    console.log("Texture:", texture);

    const source = images[texture.source];
    console.log("Image source:", source);

    if (source.bufferView !== undefined) {
      console.log("✅ bufferView найден — текстура embedded");
      const bufferView = bufferViews[source.bufferView];
      const byteOffset = bufferView.byteOffset || 0;
      textureData = binChunkData.slice(byteOffset, byteOffset + bufferView.byteLength);
      mimeType = source.mimeType || "image/png";
    } else if (source.uri) {
      console.log("❌ bufferView нет, но есть URI:", source.uri);
      // Текстура внешняя!
    } else {
      console.log("⚠️ Нет ни bufferView, ни uri");
    }
  } else {
    console.log("⚠️ Материал не использует текстуру (использует baseColorFactor?)");
  }
} else {
  console.log("⚠️ У примитива нет material");
}


      parts.push({
        vertices: positions,
        normals,
        texCoords,
        indices,
        textureData,
        mimeType,
      });
    }
  }

  return { parts };
}



// === Вспомогательные функции ===

function readUint32(dataView: DataView, offset: number, littleEndian = true): number {
  return dataView.getUint32(offset, littleEndian);
}

function readInt32(dataView: DataView, offset: number, littleEndian = true): number {
  return dataView.getInt32(offset, littleEndian);
}

// === Типы для glTF ===
type GLTFComponentType = 5126 | 5123 | 5125; // FLOAT, UNSIGNED_SHORT, UNSIGNED_INT
type GLTFAccessorType = "SCALAR" | "VEC2" | "VEC3" | "VEC4";

const TYPE_SIZE: Record<GLTFAccessorType, number> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
};

function getAccessorData(
  dataView: DataView,
  accessor: {
    bufferView: number;
    byteOffset?: number;
    count: number;
    type: GLTFAccessorType;
    componentType: GLTFComponentType;
  },
  bufferViews: Array<{ byteOffset?: number; byteLength: number }>,
  binChunkData: ArrayBuffer
): { array: Float32Array | Uint16Array | Uint32Array } {
  const bufferView = bufferViews[accessor.bufferView];
  if (!bufferView) throw new Error("Buffer view not found");

  const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
  const count = accessor.count;
  const type: GLTFAccessorType = accessor.type;
  const componentType: GLTFComponentType = accessor.componentType;

  let TypedArray:
    | typeof Float32Array
    | typeof Uint16Array
    | typeof Uint32Array;
  let bytesPerElement: number;

  switch (componentType) {
    case 5126: // FLOAT
      TypedArray = Float32Array;
      bytesPerElement = 4;
      break;
    case 5123: // UNSIGNED_SHORT
      TypedArray = Uint16Array;
      bytesPerElement = 2;
      break;
    case 5125: // UNSIGNED_INT
      TypedArray = Uint32Array;
      bytesPerElement = 4;
      break;
    default:
      throw new Error(`Unsupported componentType: ${componentType}`);
  }

  const elementSize = TYPE_SIZE[type]; // ✅ Теперь тип безопасен
  if (elementSize === undefined) {
    throw new Error(`Unsupported accessor type: ${type}`);
  }

  const expectedBytes = count * elementSize * bytesPerElement;
  if (binChunkData.byteLength < byteOffset + expectedBytes) {
    throw new Error("Buffer is smaller than expected");
  }

  const arrayBuffer = binChunkData.slice(
    byteOffset,
    byteOffset + expectedBytes
  );

  const array = new TypedArray(arrayBuffer);

  return { array };
}
