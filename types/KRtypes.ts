import { mat4 } from "gl-matrix";

export type GLTFModelPart = {
  vertices: number[];
  normals: number[];
  texCoords: number[];
  indices: number[];
  textureData: ArrayBuffer | null;
  mimeType: string;
  color: [number, number, number, number];
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
  color: [number, number, number, number];
  useTexture: boolean;
};

export type RenderModelType = {
  parts: RenderModelPart[];
  program: WebGLProgram;
  modelMatrix: mat4;
};

export type CarrotState = {
  x: number;
  z: number;
  y: number;
  falling: boolean;
  speedY: number;
  startTime?: number;
  visible: boolean;
};