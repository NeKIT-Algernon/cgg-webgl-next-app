// webgl-works/kr.ts
import { mat4, mat3 } from "gl-matrix";
import { WebGLSceneOptionsType, WorkType } from "@/types/webGLWork";
import {
  vsSourceModel,
  fsSourceModel,
  setupModelPartBuffers,
  createShaderProgram,
  createModelParts,
  renderModelParts,
  loadGLB,
} from "./kr-src";

// === Типы из kr-src (локально) ===
type RenderModelPart = {
  buffers: {
    vertex: WebGLBuffer;
    normal: WebGLBuffer | null;
    texCoord: WebGLBuffer | null;
    index: WebGLBuffer;
    count: number;
    indexType: number;
  };
  texture: WebGLTexture;
  color: [number, number, number, number];
  useTexture: boolean;
};

type RenderModelType = {
  parts: RenderModelPart[];
  program: WebGLProgram;
  modelMatrix: mat4;
};

type CarrotState = {
  x: number;
  z: number;
  y: number;
  falling: boolean;
  speedY: number;
};

// === Глобальные переменные ===
let carrotState: CarrotState = {
  x: 0,
  z: -2,
  y: 1.5,
  falling: false,
  speedY: 0,
};

let globalCarrot: RenderModelType | null = null;

// === Сцена ===
let modelData: {
  carrot: RenderModelType;
  cauldron: RenderModelType;
} | null = null;

// === Константы ===
const MAX_BUBBLES = 20;

export const KR: WorkType = {
  id: "kr",
  name: "Курсовая",
  controls: [
    "W/A/S/D — движение морковки",
    "E — погрузить морковку",
    "R — сбросить сцену",
  ],

  keyHandler: (event: KeyboardEvent, sceneOptions: WebGLSceneOptionsType) => {
    if (carrotState.falling) return;

    const speed = 0.3;
    switch (event.key.toLowerCase()) {
      case "w":
        carrotState.z -= speed;
        break;
      case "s":
        carrotState.z += speed;
        break;
      case "a":
        carrotState.x -= speed;
        break;
      case "d":
        carrotState.x += speed;
        break;
      case "e":
        carrotState.falling = true;
        break;
    }

    const bounds = 5;
    carrotState.x = Math.max(-bounds, Math.min(bounds, carrotState.x));
    carrotState.z = Math.max(-bounds, Math.min(bounds, carrotState.z));

    sceneOptions.changed = (sceneOptions.changed === 1) ? 0 : 1;
  },

  async initialize(gl: WebGL2RenderingContext, sceneOptions: WebGLSceneOptionsType) {
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    try {
      const program = createShaderProgram(gl, vsSourceModel, fsSourceModel);

      const carrotModel = await loadGLB("/models/carrot.glb");
      const cauldronModel = await loadGLB("/models/witch_cauldron.glb");

      // Матрицы
      const carrotMatrix = mat4.create();
      mat4.translate(carrotMatrix, carrotMatrix, [carrotState.x, carrotState.y, carrotState.z]);

      const cauldronMatrix = mat4.create();
      mat4.translate(cauldronMatrix, cauldronMatrix, [0, 0, 0]);
      mat4.scale(cauldronMatrix, cauldronMatrix, [1.0, 1.0, 1.0]);

      // Части моделей
      const carrotParts = await createModelParts(gl, carrotModel, program);
      const cauldronParts = await createModelParts(gl, cauldronModel, program);

      // Инициализация
      modelData = {
        carrot: {
          parts: carrotParts,
          program,
          modelMatrix: carrotMatrix,
        },
        cauldron: {
          parts: cauldronParts,
          program,
          modelMatrix: cauldronMatrix,
        },
      };

      globalCarrot = modelData.carrot;

      sceneOptions.ready = true;
      const canvas = gl.canvas as HTMLCanvasElement;
      canvas.dispatchEvent(new CustomEvent("sceneready"));

      console.log(" ModelRenderer: сцена инициализирована: котёл и морковка");
    } catch (e) {
      console.error("Ошибка инициализации сцены:", e);
      sceneOptions.ready = false;
      sceneOptions.changed = (sceneOptions.changed === 1) ? 0 : 1;
    }
  },

  render(gl: WebGL2RenderingContext, sceneOptions: WebGLSceneOptionsType) {
    if (!sceneOptions.ready || !modelData) return;

    const carrotData = modelData.carrot;
    const cauldronData = modelData.cauldron;

    if (!carrotData || !cauldronData) return;

    const program = carrotData.program;
    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();
    const modelViewMatrix = mat4.create();
    const normalMatrix = mat3.create();

    const aspect = gl.canvas.width / gl.canvas.height;
    mat4.perspective(projectionMatrix, (45 * Math.PI) / 180, aspect, 0.1, 100);
    mat4.lookAt(viewMatrix, [5, 3, 8], [0, 0, 0], [0, 1, 0]);

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    // Общие uniform'ы
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjectionMatrix"), false, projectionMatrix);
    gl.uniform3fv(gl.getUniformLocation(program, "uLightColor"), [1.0, 0.9, 0.7]);

    // === Рендер котла ===
    mat4.multiply(modelViewMatrix, viewMatrix, cauldronData.modelMatrix);
    mat3.normalFromMat4(normalMatrix, modelViewMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModelViewMatrix"), false, modelViewMatrix);
    gl.uniformMatrix3fv(gl.getUniformLocation(program, "uNormalMatrix"), false, normalMatrix);
    renderModelParts(gl, program, cauldronData.parts);

    // === Обновление морковки ===
    if (carrotState.falling) {
      carrotState.speedY -= 0.01;
      carrotState.y += carrotState.speedY;
      if (carrotState.y < -1) carrotState.y = -1;
    }

    mat4.identity(carrotData.modelMatrix);
    mat4.translate(carrotData.modelMatrix, carrotData.modelMatrix, [carrotState.x, carrotState.y, carrotState.z]);
    mat4.scale(carrotData.modelMatrix, carrotData.modelMatrix, [0.03, 0.03, 0.03]);

    // === Рендер морковки ===
    mat4.multiply(modelViewMatrix, viewMatrix, carrotData.modelMatrix);
    mat3.normalFromMat4(normalMatrix, modelViewMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModelViewMatrix"), false, modelViewMatrix);
    gl.uniformMatrix3fv(gl.getUniformLocation(program, "uNormalMatrix"), false, normalMatrix);
    renderModelParts(gl, program, carrotData.parts);

    // Для отладки
    console.log("рендер: позиция морковки:", [carrotState.x, carrotState.y, carrotState.z]);
  },

  dispose(gl: WebGL2RenderingContext) {
    // Очистка буферов, текстур, программ — при необходимости
    modelData = null;
    globalCarrot = null;
  },
};
