import { mat4, mat3 } from "gl-matrix";
import {
  GLTFModelPart,
  GLTFModel,
  RenderModelPartBuffers,
  RenderModelPart,
} from "@/types/KRtypes"

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
uniform vec4 uBaseColor;
uniform bool uUseTexture;

out vec4 fragColor;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float diff = max(dot(normal, lightDir), 0.3);

    vec4 color = uUseTexture ? texture(uSampler, vTexCoord) : uBaseColor;
    fragColor = vec4(color.rgb * diff * uLightColor, color.a);
}
`;

// === Буферы и рендеринг ===
export function setupModelPartBuffers(
  gl: WebGL2RenderingContext,
  part: GLTFModelPart
): RenderModelPartBuffers {
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(part.vertices), gl.STATIC_DRAW);

  const normalBuffer = gl.createBuffer();
  const normalBufferData = part.normals.length > 0 ? (() => {
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(part.normals), gl.STATIC_DRAW);
    return normalBuffer;
  })() : null;

  const texCoordBuffer = gl.createBuffer();
  const texCoordBufferData = part.texCoords.length > 0 ? (() => {
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(part.texCoords), gl.STATIC_DRAW);
    return texCoordBuffer;
  })() : null;

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

export function renderModelParts(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  parts: RenderModelPart[]
) {
  for (const part of parts) {
    const { buffers, texture, color, useTexture } = part;

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

    gl.uniform1i(gl.getUniformLocation(program, "uUseTexture"), useTexture ? 1 : 0);
    gl.uniform4fv(gl.getUniformLocation(program, "uBaseColor"), color);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, "uSampler"), 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
    gl.drawElements(gl.TRIANGLES, buffers.count, buffers.indexType, 0);
  }
}

// === Текстуры ===
export function createTextureFromData(
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
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

      URL.revokeObjectURL(url);
      resolve(texture);
    };

    image.onerror = () => {
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

// === Загрузка GLB ===
export async function loadGLB(url: string): Promise<GLTFModel> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load GLB: ${url}`);

  const arrayBuffer = await response.arrayBuffer();
  const dataView = new DataView(arrayBuffer);
  let offset = 0;

  if (readUint32(dataView, offset) !== 0x46546C67) throw new Error("Invalid GLB magic");
  offset += 8; // magic + version
  offset += 4; // length

  let jsonChunk: string | null = null;
  let binChunkData: ArrayBuffer | null = null;

  while (offset < arrayBuffer.byteLength) {
    const chunkLength = readUint32(dataView, offset); offset += 4;
    const chunkType = readUint32(dataView, offset); offset += 4;
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

  if (!jsonChunk) throw new Error("No JSON chunk in GLB");
  if (!binChunkData) throw new Error("No binary chunk in GLB");

  const json = JSON.parse(jsonChunk);
  const bufferViews = json.bufferViews || [];
  const accessors = json.accessors || [];
  const images = json.images || [];
  const textures = json.textures || [];
  const materials = json.materials || [];

  const parts: GLTFModelPart[] = [];

  for (const mesh of json.meshes || []) {
    for (const prim of mesh.primitives || []) {
      const posAccessor = accessors[prim.attributes.POSITION];
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

      let textureData: ArrayBuffer | null = null;
      let mimeType = "image/png";
      let color: [number, number, number, number] = [1.0, 1.0, 1.0, 1.0];

      if (prim.material !== undefined) {
        const material = materials[prim.material];

        // BaseColor (PBR)
        if (material?.pbrMetallicRoughness?.baseColorTexture) {
          const source = images[textures[material.pbrMetallicRoughness.baseColorTexture.index].source];
          textureData = extractTextureData(source, bufferViews, binChunkData);
          mimeType = source.mimeType || "image/png";
        }
        // Diffuse (KHR fallback)
        else if (material.extensions?.KHR_materials_pbrSpecularGlossiness?.diffuseTexture) {
          const source = images[textures[material.extensions.KHR_materials_pbrSpecularGlossiness.diffuseTexture.index].source];
          textureData = extractTextureData(source, bufferViews, binChunkData);
          mimeType = source.mimeType || "image/png";
        }

        if (textureData === null) {
          color = material.extensions?.KHR_materials_pbrSpecularGlossiness?.diffuseFactor ||
                  material?.pbrMetallicRoughness?.baseColorFactor ||
                  [1.0, 1.0, 1.0, 1.0];
        }
      }

      parts.push({ vertices: positions, normals, texCoords, indices, textureData, mimeType, color });
    }
  }

  return { parts };
}

function extractTextureData(
  source: any,
  bufferViews: any[],
  binChunkData: ArrayBuffer
): ArrayBuffer | null {
  if (source.bufferView !== undefined) {
    const bufferView = bufferViews[source.bufferView];
    const byteOffset = bufferView.byteOffset || 0;
    return binChunkData.slice(byteOffset, byteOffset + bufferView.byteLength);
  }
  return null;
}

// === Вспомогательные ===
function readUint32(dataView: DataView, offset: number): number {
  return dataView.getUint32(offset, true);
}

type GLTFComponentType = 5126 | 5123 | 5125;
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
  const elementSize = TYPE_SIZE[accessor.type];
  const bytesPerElement = accessor.componentType === 5126 ? 4
                            : accessor.componentType === 5123 ? 2
                            : 4;

  const expectedBytes = count * elementSize * bytesPerElement;
  if (binChunkData.byteLength < byteOffset + expectedBytes) {
    throw new Error("Buffer is smaller than expected");
  }

  const arrayBuffer = binChunkData.slice(byteOffset, byteOffset + expectedBytes);
  const TypedArray = accessor.componentType === 5126 ? Float32Array
                    : accessor.componentType === 5123 ? Uint16Array
                    : Uint32Array;

  return { array: new TypedArray(arrayBuffer) };
}

// === Специальные модели ===
export function createSkySphere(radius: number, slices: number, stacks: number): GLTFModelPart {
  const vertices: number[] = [];
  const texCoords: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= stacks; i++) {
    const phi = Math.PI * i / stacks;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    for (let j = 0; j <= slices; j++) {
      const theta = 2 * Math.PI * j / slices;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      vertices.push(radius * sinPhi * cosTheta, radius * cosPhi, radius * sinPhi * sinTheta);
      texCoords.push(j / slices, i / stacks);
    }
  }

  for (let i = 0; i < stacks; i++) {
    for (let j = 0; j < slices; j++) {
      const first = i * (slices + 1) + j;
      const second = first + slices + 1;
      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  return {
    vertices,
    normals: vertices.slice(),
    texCoords,
    indices,
    textureData: null,
    mimeType: "image/png",
    color: [1.0, 1.0, 1.0, 1.0],
  };
}

// === Модельные операции ===
export async function createModelParts(
  gl: WebGL2RenderingContext,
  model: GLTFModel,
  program: WebGLProgram
): Promise<RenderModelPart[]> {
  const parts: RenderModelPart[] = [];

  for (const part of model.parts) {
    const buffers = setupModelPartBuffers(gl, part);
    const texture = part.textureData
      ? await createTextureFromData(gl, part.textureData, part.mimeType)
      : createPlaceholderTexture(gl, 255 * part.color[0], 255 * part.color[1], 255 * part.color[2]);

    parts.push({
      buffers,
      texture,
      color: part.color,
      useTexture: !!part.textureData,
    });
  }

  return parts;
}
