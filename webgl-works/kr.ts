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

// === Система пузырьков ===
type Bubble = {
  x: number;
  y: number;
  z: number;
  speed: number;
  size: number;
  sway: number;
  swaySpeed: number;
  swayOffset: number;
};

let bubbles: Bubble[] = [];
let bubblesActive = false; // активна ли анимация
let bubblesStarted = false; // 🔁 флаг: уже запускали?


let isAnimating = false;
let animationFrameId: number | null = null;

let globalCarrot: RenderModelType | null = null;
let modelData: {
  carrot: RenderModelType;
  cauldron: RenderModelType;
  bubble: RenderModelType;
} | null = null;


function spawnBubble() {
  if (bubbles.length >= MAX_BUBBLES) return;

  // Случайная позиция внутри котла (примерные границы)
  const radius = 0.4;
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * radius;
  const x = -0.5 + Math.cos(angle) * distance;
  const z = 0 + Math.sin(angle) * distance;

  bubbles.push({
    x,
    y: 3, // старт снизу котла
    z,
    speed: 0.02 + Math.random() * 0.03, // разная скорость
    size: 0.01 + Math.random() * 0.02, // разный размер
    sway: 0.01 + Math.random() * 0.02,
    swaySpeed: 0.5 + Math.random() * 1,
    swayOffset: Math.random() * Math.PI * 2,
  });
}

function updateBubbles(time: number) {
  // Генерация новых пузырьков
  if (Math.random() < 0.2) { // ~20% шанс за кадр
    spawnBubble();
  }

  // Обновляем позиции
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.y += b.speed;

    // Боковое покачивание
    b.x += Math.sin(time * b.swaySpeed + b.swayOffset) * b.sway * 0.01;

    // Удаляем, если улетели
    if (b.y > 4) {
      bubbles.splice(i, 1);
    }
  }
}

function renderBubbles(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  viewMatrix: mat4,
  projectionMatrix: mat4,
  normalMatrix: mat3
) {
  if (!modelData?.bubble) return;

  const { parts: bubbleParts } = modelData.bubble; // ← [singleBubblePart]
  const part = bubbleParts[0]; // ← только один

  for (const bubble of bubbles) {
    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, [bubble.x, bubble.y, bubble.z]);
    mat4.scale(modelMatrix, modelMatrix, [bubble.size, bubble.size, bubble.size]);

    const modelViewMatrix = mat4.create();
    mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
    mat3.normalFromMat4(normalMatrix, modelViewMatrix);

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModelViewMatrix"), false, modelViewMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjectionMatrix"), false, projectionMatrix);
    gl.uniformMatrix3fv(gl.getUniformLocation(program, "uNormalMatrix"), false, normalMatrix);

    gl.uniform4fv(gl.getUniformLocation(program, "uBaseColor"), [0.7, 0.9, 1.0, 0.6]);
    gl.uniform1i(gl.getUniformLocation(program, "uUseTexture"), 0);

    // Рисуем ТОЛЬКО ОДИН пузырь
    renderModelParts(gl, program, [part]); // ← массив из одного part
  }
}


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

      // При нажатии R
      bubbles = [];
      bubblesActive = false;
      bubblesStarted = false; // 🔁 сбрасываем



      sceneOptions.changed = sceneOptions.changed === 1 ? 0 : 1;
      return;
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

    // --- Блокировка управления после падения ---
    if (carrotState.y <= carrotBottom) {
      return; // только R работает
    }

    // Ограничения
    const bounds = 3;
    carrotState.x = Math.max(-bounds, Math.min(bounds, carrotState.x));
    carrotState.z = Math.max(-bounds, Math.min(bounds, carrotState.z));

    // --- Запуск падения ---
    if (event.code === "Space" && !carrotState.falling && carrotState.y > carrotBottom) {
      carrotState.falling = true;

      carrotState.startTime = Date.now() * 0.001;; // сохраняем время начала падения

      sceneOptions.changed = sceneOptions.changed === 1 ? 0 : 1;
      return;
    }

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
  },


  async initialize(gl: WebGL2RenderingContext, sceneOptions: WebGLSceneOptionsType) {
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    try {
      const program = createShaderProgram(gl, vsSourceModel, fsSourceModel);

      const carrotModel = await loadGLB("/models/carrot.glb");
      const cauldronModel = await loadGLB("/models/witch_cauldron.glb");
      const bubbleModel = await loadGLB("/models/bubbles_3.glb");
      const allBubbleParts = await createModelParts(gl, bubbleModel, program);

      // 🔍 Логируем геометрию котла — посмотрим вершины
      const firstPart = cauldronModel.parts[0];
      const positions = firstPart.vertices;

      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;

      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z);
        maxZ = Math.max(maxZ, z);
      }

      console.log("Bounding box котла (локальные координаты):", {
        x: [minX, maxX],
        y: [minY, maxY],
        z: [minZ, maxZ],
        size: {
          width: maxX - minX,
          height: maxY - minY,
          depth: maxZ - minZ,
        },
      });


      // Берём ТОЛЬКО ОДИН пузырь — например, первый
      const singleBubblePart = allBubbleParts[0]; // ← это и есть один пузырь

      // Создаём специальную модель только для одного пузыря
      const bubbleTemplate: RenderModelType = {
        parts: [singleBubblePart],
        program,
        modelMatrix: mat4.create(),
      };



      // Матрицы
      const carrotMatrix = mat4.create();
      mat4.translate(carrotMatrix, carrotMatrix, [carrotState.x, carrotState.y, carrotState.z]);

      const cauldronMatrix = mat4.create();
      mat4.translate(cauldronMatrix, cauldronMatrix, [0, 0, 0]);
      mat4.scale(cauldronMatrix, cauldronMatrix, [1.0, 1.0, 1.0]);

      const bubbleMatrix = mat4.create();
      const bubbleParts = await createModelParts(gl, bubbleModel, program);


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
        bubble: bubbleTemplate
      };


      globalCarrot = modelData.carrot;

      sceneOptions.ready = true;
      const canvas = gl.canvas as HTMLCanvasElement;
      canvas.dispatchEvent(new CustomEvent("sceneready"));
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

    // === Проверка: морковка достигла дна — запуск пузырьков ===
    if (
      !carrotState.falling &&
      carrotState.y <= carrotBottom &&
      !bubblesStarted
    ) {
      // Проверка попадания
      if (Math.hypot(carrotState.x, carrotState.z) < 0.5) {
        // Успешное попадание
        bubblesActive = true;
        bubblesStarted = true;
        for (let i = 0; i < 5; i++) spawnBubble();
      } else {
        // Морковка упала мимо котла — можно добавить эффект?
        console.log("Морковка промахнулась!");
      }
    }


    // === Обновление и рендер пузырьков ===
    if (bubblesActive) {
      if (sceneOptions.time) updateBubbles(sceneOptions.time);
      renderBubbles(gl, program, viewMatrix, projectionMatrix, normalMatrix);
    }


    // === Анимация падения ===
    if (carrotState.falling && carrotState.y > carrotBottom && sceneOptions.time) {
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
    }
    // === Обновляем модель морковки ===
    mat4.identity(carrotData.modelMatrix);
    mat4.translate(carrotData.modelMatrix, carrotData.modelMatrix, [carrotState.x, carrotState.y, carrotState.z]);
    mat4.scale(carrotData.modelMatrix, carrotData.modelMatrix, [0.02, 0.02, 0.02]);

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
