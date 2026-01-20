// webgl-works/kr.ts
import { mat4, mat3, vec3 } from "gl-matrix";
import { WebGLSceneOptionsType, WorkType } from "@/types/webGLWork";
import {
  vsSourceModel,
  fsSourceModel,
  setupModelPartBuffers,
  createShaderProgram,
  createModelParts,
  renderModelParts,
  loadGLB,
  RenderModelPart,
  RenderModelType,
  CarrotState,
} from "./kr-src";

// === Глобальные переменные ===

const carrotBottom = -0.1;

// === Глобальные переменные ===
let cameraTheta = 45;
let cameraPhi = 60;
let cameraRadius = 8;

let carrotState: CarrotState = {
  x: 0,
  z: 0,
  y: 1.5,
  falling: false,
  speedY: 0,
};

let isAnimating = false;
let animationFrameId: number | null = null;

let globalCarrot: RenderModelType | null = null;
let modelData: { carrot: RenderModelType; cauldron: RenderModelType } | null = null;


// === Константы ===
const MAX_BUBBLES = 20;

export const KR: WorkType = {
  id: "kr",
  name: "Курсовая",
  controls: [
    "Стрелки ←→↑↓ — движение морковки (относительно камеры)",
    "Пробел — погрузить морковку в котёл",
    "R — сбросить сцену",
    "W/A/S/D — вращение камеры",
    "+/- — приближение/отдаление",
  ],


keyHandler: (event: KeyboardEvent, sceneOptions: WebGLSceneOptionsType) => {
  // --- Сброс сцены ---
  if (event.code === "KeyR") {
    carrotState.x = 0;
    carrotState.z = 0;
    carrotState.y = 1.5;
    carrotState.falling = false;
    carrotState.speedY = 0;

    sceneOptions.changed = sceneOptions.changed === 1 ? 0 : 1;
    return;
  }

  // --- Запуск падения ---
  if (event.code === "Space" && !carrotState.falling && carrotState.y > carrotBottom) {
    carrotState.falling = true;
    carrotState.startTime = Date.now() * 0.001;; // сохраняем время начала падения

    sceneOptions.changed = sceneOptions.changed === 1 ? 0 : 1;
    return;
  }

  // --- Блокировка управления после падения ---
  if (carrotState.y <= carrotBottom) {
    return; // только R работает
  }

  // === Пересчитываем векторы камеры ===
  const thetaRad = (cameraTheta * Math.PI) / 180;
  const phiRad = (cameraPhi * Math.PI) / 180;

  const camX = cameraRadius * Math.sin(phiRad) * Math.cos(thetaRad);
  const camY = cameraRadius * Math.cos(phiRad);
  const camZ = cameraRadius * Math.sin(phiRad) * Math.sin(thetaRad);

  const eye = vec3.fromValues(camX, camY, camZ);
  const center = vec3.fromValues(0, 0, 0);
  const up = vec3.fromValues(0, 1, 0);

  const forward = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), center, eye));
  const right = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), forward, up));

  const speed = 0.1;

  switch (event.code) {
    case "ArrowUp": {
      const move = vec3.scale(vec3.create(), forward, speed);
      carrotState.x += move[0];
      carrotState.z += move[2];
      break;
    }
    case "ArrowDown": {
      const move = vec3.scale(vec3.create(), forward, -speed);
      carrotState.x += move[0];
      carrotState.z += move[2];
      break;
    }
    case "ArrowLeft": {
      const move = vec3.scale(vec3.create(), right, -speed);
      carrotState.x += move[0];
      carrotState.z += move[2];
      break;
    }
    case "ArrowRight": {
      const move = vec3.scale(vec3.create(), right, speed);
      carrotState.x += move[0];
      carrotState.z += move[2];
      break;
    }
  }

  // Ограничения
  const bounds = 3;
  carrotState.x = Math.max(-bounds, Math.min(bounds, carrotState.x));
  carrotState.z = Math.max(-bounds, Math.min(bounds, carrotState.z));

  // === Управление камерой — как раньше ===
  const camSpeed = 5;
  switch (event.code) {
    case "KeyW":
      cameraPhi = Math.max(10, cameraPhi - camSpeed);
      break;
    case "KeyS":
      cameraPhi = Math.min(170, cameraPhi + camSpeed);
      break;
    case "KeyA":
      cameraTheta -= camSpeed;
      break;
    case "KeyD":
      cameraTheta += camSpeed;
      break;
    case "NumpadAdd":
    case "Equal":
      cameraRadius = Math.max(3, cameraRadius - 0.2);
      break;
    case "NumpadSubtract":
    case "Minus":
      cameraRadius = Math.min(15, cameraRadius + 0.2);
      break;
  }

  sceneOptions.changed = sceneOptions.changed === 1 ? 0 : 1;
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
    console.log("render");
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

  // Сферические координаты
  const thetaRad = (cameraTheta * Math.PI) / 180;
  const phiRad = (cameraPhi * Math.PI) / 180;

  const camX = cameraRadius * Math.sin(phiRad) * Math.cos(thetaRad);
  const camY = cameraRadius * Math.cos(phiRad);
  const camZ = cameraRadius * Math.sin(phiRad) * Math.sin(thetaRad);

  mat4.lookAt(viewMatrix, [camX, camY, camZ], [0, 0, 0], [0, 1, 0]);

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

  // === Анимация падения ===
   console.log ("carrotState.falling = ", carrotState.falling + " carrotState.y = ", carrotState.y + " sceneOptions.time", sceneOptions.time);
  if (carrotState.falling && carrotState.y > carrotBottom && sceneOptions.time) {
    console.log("if");
    console.log("carrotState.startTime = ", carrotState.startTime);
    const elapsed = sceneOptions.time - (carrotState.startTime || sceneOptions.time);
    const fallDuration = 1.5; // секунды
    const targetY = carrotBottom;

    // Линейная интерполяция (можно улучшить на физике)
    const t = Math.min(elapsed / fallDuration, 1);
    const newY = 1.5 - t * (1.5 - targetY);
    carrotState.y = newY;

    if (t >= 1) {
      carrotState.y = targetY;
      carrotState.falling = false;
    }
    console.log("newY = ", newY);
  }
  // === Обновляем модель морковки ===
  mat4.identity(carrotData.modelMatrix);
  mat4.translate(carrotData.modelMatrix, carrotData.modelMatrix, [carrotState.x, carrotState.y, carrotState.z]);
  mat4.scale(carrotData.modelMatrix, carrotData.modelMatrix, [0.03, 0.03, 0.03]);

  // === Рендер морковки ===
  mat4.multiply(modelViewMatrix, viewMatrix, carrotData.modelMatrix);
  mat3.normalFromMat4(normalMatrix, modelViewMatrix);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModelViewMatrix"), false, modelViewMatrix);
  gl.uniformMatrix3fv(gl.getUniformLocation(program, "uNormalMatrix"), false, normalMatrix);
  renderModelParts(gl, program, carrotData.parts);
},


  dispose(gl: WebGL2RenderingContext) {
    // Очистка буферов, текстур, программ — при необходимости
    modelData = null;
    globalCarrot = null;
  },
};
