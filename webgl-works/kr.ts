// webgl-works/kr.ts
import {
  mat4,
  mat3,
  vec3,
} from "gl-matrix";
import {
  vsSourceModel,
  fsSourceModel,
  setupModelPartBuffers,
  createShaderProgram,
  createModelParts,
  renderModelParts,
  loadGLB,
  createSkySphere,
  createTextureFromData,
} from "./kr-src";
import {
  WebGLSceneOptionsType,
  WorkType,
} from "@/types/webGLWork";
import {
  RenderModelPart,
  RenderModelType,
  CarrotState,
} from "@/types/KRtypes"

// === Константы ===
const DEFAULT_CAMERA_THETA = 45;
const DEFAULT_CAMERA_PHI = 60;
const DEFAULT_CAMERA_RADIUS = 8;
const DEFAULT_TARGET_OFFSET: [number, number] = [0, 0];
const MAX_BUBBLES = 20;
const BUBBLE_SPAWN_RATE = 0.2; // вероятность за кадр
const BREW_DURATION = 5.0;      // время кипения (сек)
const COFFEE_FLY_DURATION = 2.0; // время подъёма (сек)
const ORBIT_SPEED = 1;

// === Глобальные состояния ===

// Камера
let cameraTheta = DEFAULT_CAMERA_THETA;
let cameraPhi = DEFAULT_CAMERA_PHI;
let cameraRadius = DEFAULT_CAMERA_RADIUS;
let cameraTargetOffset: [number, number] = [0, 0]; // [x, y] смещение центра вращения

// Анимации
let orbitOffsetX = 0;
let orbitOffsetZ = 0;

// Морковка
let carrotState: CarrotState = {
  x: 0,
  z: 0,
  y: 2,
  falling: false,
  speedY: 0,
  visible: true,
};

const carrotBottom = 0.2; // y-позиция дна

// Кофе
let coffeeState: { visible: boolean; y: number } = {
  visible: false,
  y: -0.5,
};
let coffeeStartTime: number | null = null;

// Пузырьки
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
let bubblesActive = false;
let bubblesStarted = false;

// === Модели ===
let modelData: {
  carrot: RenderModelType;
  cauldron: RenderModelType;
  bubble: RenderModelType;
  coffee: RenderModelType;
} | null = null;

let skySphere: RenderModelType | null = null;
let skyTexture: WebGLTexture | null = null;

// === Работа с пузырьками ===
function spawnBubble() {
  if (bubbles.length >= MAX_BUBBLES) return;

  const radius = 0.4;
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * radius;
  const x = -0.5 + Math.cos(angle) * distance;
  const z = Math.sin(angle) * distance;

  bubbles.push({
    x,
    y: 3,
    z,
    speed: 0.02 + Math.random() * 0.03,
    size: 0.01 + Math.random() * 0.02,
    sway: 0.01 + Math.random() * 0.02,
    swaySpeed: 0.5 + Math.random() * 1,
    swayOffset: Math.random() * Math.PI * 2,
  });
}

function updateBubbles(time: number) {
  if (Math.random() < BUBBLE_SPAWN_RATE) {
    spawnBubble();
  }

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.y += b.speed;
    b.x += Math.sin(time * b.swaySpeed + b.swayOffset) * b.sway * 0.01;

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
  const bubblePart = modelData.bubble.parts[0];

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

    renderModelParts(gl, program, [bubblePart]);
  }
}

// === Основной объект работы ===
export const KR: WorkType = {
  id: "kr",
  name: "Курсовая",
  controls: [
    "W/A/S/D — вращение камеры",
    "T / G - наклон камеры",
    "+/- — приближение/отдаление",
    "E - базовые настройки камеры",
    "Стрелки ←→↑↓ — движение морковки",
    "Пробел — погрузить морковку",
    "R — сбросить сцену",
  ],

  keyHandler: (event: KeyboardEvent, sceneOptions: WebGLSceneOptionsType) => {
  // --- Сброс сцены (имеет наивысший приоритет) ---
  if (event.code === "KeyR") {
    cameraTheta = DEFAULT_CAMERA_THETA;
    cameraPhi = DEFAULT_CAMERA_PHI;
    cameraRadius = DEFAULT_CAMERA_RADIUS;
    cameraTargetOffset = [0, 0];

    carrotState = { x: 0, z: 0, y: 2, falling: false, speedY: 0, visible: true };
    coffeeState = { visible: false, y: -0.5 };
    coffeeStartTime = null;
    bubbles = [];
    bubblesActive = false;
    bubblesStarted = false;

    sceneOptions.changed = sceneOptions.changed === 1 ? 0 : 1;
    return;
  }

  // --- Управление камерой ---
  switch (event.code) {
    case "KeyE":
      cameraTheta = DEFAULT_CAMERA_THETA;
      cameraPhi = DEFAULT_CAMERA_PHI;
      cameraRadius = DEFAULT_CAMERA_RADIUS;
      cameraTargetOffset[0] = DEFAULT_TARGET_OFFSET[0];
      cameraTargetOffset[1] = DEFAULT_TARGET_OFFSET[1];
      sceneOptions.changed = sceneOptions.changed === 1 ? 0 : 1;
      return;
    case "KeyW": cameraPhi = Math.max(10, cameraPhi - 5); break;
    case "KeyS": cameraPhi = Math.min(170, cameraPhi + 5); break;
    case "KeyA": cameraTheta -= 5; break;
    case "KeyD": cameraTheta += 5; break;
    case "NumpadAdd":
    case "Equal": cameraRadius = Math.max(3, cameraRadius - 0.2); break;
    case "NumpadSubtract":
    case "Minus": cameraRadius = Math.min(15, cameraRadius + 0.2); break;
    case "KeyT": cameraTargetOffset[1] = Math.min(cameraTargetOffset[1] + 0.2, 2); break;
    case "KeyG": cameraTargetOffset[1] = Math.max(cameraTargetOffset[1] - 0.2, -2); break;
  }

  // --- Управление морковкой (только если она ещё падает) ---
  if (carrotState.y <= carrotBottom) {
    sceneOptions.changed = sceneOptions.changed === 1 ? 0 : 1;
    return;
  }

  // Запуск падения
  if (event.code === "Space" && !carrotState.falling) {
    carrotState.falling = true;
    carrotState.startTime = Date.now() * 0.001;
    sceneOptions.changed = sceneOptions.changed === 1 ? 0 : 1;
    return;
  }

  // Движение морковки (относительно камеры)
  const thetaRad = (cameraTheta * Math.PI) / 180;
  const phiRad = (cameraPhi * Math.PI) / 180;
  const camX = cameraRadius * Math.sin(phiRad) * Math.cos(thetaRad);
  const camZ = cameraRadius * Math.sin(phiRad) * Math.sin(thetaRad);
  const eye = vec3.fromValues(camX, 0, camZ);
  const center = vec3.fromValues(0, 0, 0);
  const forward = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), center, eye));
  const right = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), forward, [0, 1, 0]));
  const speed = 0.1;

  switch (event.code) {
    case "ArrowUp": {
      const move = vec3.scale(vec3.create(), forward, speed * 3);
      carrotState.x += move[0];
      carrotState.z += move[2];
      break;
    }
    case "ArrowDown": {
      const move = vec3.scale(vec3.create(), forward, -speed * 3);
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

  // --- Ограничение движения морковки в радиусе ---
  const maxRadius = 2.5;
  const distanceSq = carrotState.x ** 2 + carrotState.z ** 2;
  if (distanceSq > maxRadius ** 2) {
    const distance = Math.sqrt(distanceSq);
    carrotState.x = (carrotState.x / distance) * maxRadius;
    carrotState.z = (carrotState.z / distance) * maxRadius;
  }

  // --- Зафиксировать изменение сцены ---
  sceneOptions.changed = sceneOptions.changed === 1 ? 0 : 1;
},


  async initialize(gl: WebGL2RenderingContext, sceneOptions: WebGLSceneOptionsType) {
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    try {
      const program = createShaderProgram(gl, vsSourceModel, fsSourceModel);

      // === Фон (сфера) ===
      skyTexture = await createTextureFromData(
        gl,
        await (await fetch("/textures/bcg.jpg")).arrayBuffer(),
        "image/jpeg"
      );
      const skyPart = createSkySphere(100, 64, 32);
      const skyBuffers = setupModelPartBuffers(gl, skyPart);
      const skyModelPart: RenderModelPart = {
        buffers: skyBuffers,
        texture: skyTexture,
        color: [1.0, 1.0, 1.0, 1.0],
        useTexture: true,
      };
      skySphere = {
        parts: [skyModelPart],
        program,
        modelMatrix: mat4.create(),
      };

      // === Загрузка моделей ===
      const [carrotModel, cauldronModel, bubbleModel, coffeeModel] = await Promise.all([
        loadGLB("/models/carrot.glb"),
        loadGLB("/models/witch_cauldron.glb"),
        loadGLB("/models/bubbles_3.glb"),
        loadGLB("/models/coffee.glb"),
      ]);

      // Лог: границы котла
      const firstPart = cauldronModel.parts[0];
      const positions = firstPart.vertices;
      let [minX, maxX, minY, maxY, minZ, maxZ] = [Infinity, -Infinity, Infinity, -Infinity, Infinity, -Infinity];
      for (let i = 0; i < positions.length; i += 3) {
        minX = Math.min(minX, positions[i]);
        maxX = Math.max(maxX, positions[i]);
        minY = Math.min(minY, positions[i + 1]);
        maxY = Math.max(maxY, positions[i + 1]);
        minZ = Math.min(minZ, positions[i + 2]);
        maxZ = Math.max(maxZ, positions[i + 2]);
      }
      console.log("Bounding box котла:", { x: [minX, maxX], y: [minY, maxY], z: [minZ, maxZ] });

      // Подготовка частей
      const [carrotParts, cauldronParts, allBubbleParts, coffeeParts] = await Promise.all([
        createModelParts(gl, carrotModel, program),
        createModelParts(gl, cauldronModel, program),
        createModelParts(gl, bubbleModel, program),
        createModelParts(gl, coffeeModel, program),
      ]);

      // Шаблон одного пузыря
      const bubbleTemplate: RenderModelType = {
        parts: [allBubbleParts[0]],
        program,
        modelMatrix: mat4.create(),
      };

      // Матрицы
      const carrotMatrix = mat4.create();
      const cauldronMatrix = mat4.create();
      mat4.translate(cauldronMatrix, cauldronMatrix, [0, 0, 0]);
      mat4.scale(cauldronMatrix, cauldronMatrix, [1.0, 1.0, 1.0]);

      modelData = {
        carrot: { parts: carrotParts, program, modelMatrix: carrotMatrix },
        cauldron: { parts: cauldronParts, program, modelMatrix: cauldronMatrix },
        bubble: bubbleTemplate,
        coffee: { parts: coffeeParts, program, modelMatrix: mat4.create() },
      };

      sceneOptions.ready = true;
      const canvas = gl.canvas as HTMLCanvasElement;
      canvas.dispatchEvent(new CustomEvent("sceneready"));
    } catch (e) {
      console.error("Ошибка инициализации сцены:", e);
      sceneOptions.ready = false;
      sceneOptions.changed = sceneOptions.changed === 1 ? 0 : 1;
    }
  },

  render(gl: WebGL2RenderingContext, sceneOptions: WebGLSceneOptionsType) {
    if (!sceneOptions.ready || !modelData) return;

    const program = modelData.carrot.program;
    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();
    const modelViewMatrix = mat4.create();
    const normalMatrix = mat3.create();

    const aspect = gl.canvas.width / gl.canvas.height;
    mat4.perspective(projectionMatrix, (45 * Math.PI) / 180, aspect, 0.1, 100);

    // === Обновление камеры ===
    const thetaRad = (cameraTheta * Math.PI) / 180;
    const phiRad = (cameraPhi * Math.PI) / 180;
    const camX = cameraRadius * Math.sin(phiRad) * Math.cos(thetaRad) + orbitOffsetX;
    const camZ = cameraRadius * Math.sin(phiRad) * Math.sin(thetaRad) + orbitOffsetZ;
    const camY = cameraRadius * Math.cos(phiRad);

    mat4.lookAt(viewMatrix, [camX, camY, camZ], [cameraTargetOffset[0], cameraTargetOffset[1], 0], [0, 1, 0]);

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // === Рендер фона ===
    if (skySphere && skyTexture) {
      gl.depthMask(false);
      gl.disable(gl.DEPTH_TEST);

      const skyPart = skySphere.parts[0];
      const skyViewMatrix = mat4.clone(viewMatrix);
      skyViewMatrix[12] = 0;
      skyViewMatrix[13] = 0;
      skyViewMatrix[14] = 0;

      gl.useProgram(program);
      gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModelViewMatrix"), false, skyViewMatrix);
      gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjectionMatrix"), false, projectionMatrix);
      gl.uniformMatrix3fv(gl.getUniformLocation(program, "uNormalMatrix"), false, mat3.create());
      gl.uniform4fv(gl.getUniformLocation(program, "uBaseColor"), [1.0, 1.0, 1.0, 1.0]);
      gl.uniform1i(gl.getUniformLocation(program, "uUseTexture"), 1);
      gl.bindTexture(gl.TEXTURE_2D, skyTexture);
      gl.uniform1i(gl.getUniformLocation(program, "uSampler"), 0);
      renderModelParts(gl, program, [skyPart]);

      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
    }

    gl.useProgram(program);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjectionMatrix"), false, projectionMatrix);
    gl.uniform3fv(gl.getUniformLocation(program, "uLightColor"), [1.0, 0.9, 0.7]);

    // === Котёл ===
    mat4.multiply(modelViewMatrix, viewMatrix, modelData.cauldron.modelMatrix);
    mat3.normalFromMat4(normalMatrix, modelViewMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModelViewMatrix"), false, modelViewMatrix);
    gl.uniformMatrix3fv(gl.getUniformLocation(program, "uNormalMatrix"), false, normalMatrix);
    renderModelParts(gl, program, modelData.cauldron.parts);

    // === Запуск пузырьков при попадании ===
    if (
      !carrotState.falling &&
      carrotState.y <= carrotBottom &&
      !bubblesStarted &&
      Math.hypot(carrotState.x, carrotState.z) < 0.6
    ) {
      bubblesActive = true;
      bubblesStarted = true;
      for (let i = 0; i < 5; i++) spawnBubble();
    }

    // === Анимация варки зелья → кофе ===
    if (bubblesStarted && !coffeeState.visible && sceneOptions.time) {
      const brewElapsed = sceneOptions.time - (carrotState.startTime || sceneOptions.time);
      if (brewElapsed >= BREW_DURATION) {
        bubblesActive = false;
        coffeeState.visible = true;
        coffeeStartTime = sceneOptions.time;
      }
    }

    // === Анимация кофе ===
    if (coffeeState.visible && sceneOptions.time) {
      const elapsed = coffeeStartTime ? sceneOptions.time - coffeeStartTime : 0;
      const flyT = Math.min(elapsed / COFFEE_FLY_DURATION, 1);
      coffeeState.y = -0.5 + flyT * 1.5;

      mat4.identity(modelData.coffee.modelMatrix);
      mat4.translate(modelData.coffee.modelMatrix, modelData.coffee.modelMatrix, [0, coffeeState.y, 0]);
      mat4.rotateX(modelData.coffee.modelMatrix, modelData.coffee.modelMatrix, -Math.PI / 2);
      mat4.scale(modelData.coffee.modelMatrix, modelData.coffee.modelMatrix, [0.03, 0.03, 0.03]);
    }

    // === Пузырьки ===
    if (bubblesActive && sceneOptions.time) {
      updateBubbles(sceneOptions.time);
      renderBubbles(gl, program, viewMatrix, projectionMatrix, normalMatrix);
    }

    // === Падение морковки ===
    if (carrotState.falling && carrotState.y > carrotBottom && sceneOptions.time) {
      const t = sceneOptions.time - (carrotState.startTime || sceneOptions.time);
      const g = 1.8;
      const newY = 2 - 0.5 * g * t * t;
      carrotState.y = Math.max(newY, carrotBottom);
      if (newY <= carrotBottom) {
        carrotState.falling = false;
        carrotState.visible = false;
      }
    }

    // === Обновление морковки ===
    mat4.identity(modelData.carrot.modelMatrix);
    mat4.translate(modelData.carrot.modelMatrix, modelData.carrot.modelMatrix, [carrotState.x, carrotState.y, carrotState.z]);
    mat4.scale(modelData.carrot.modelMatrix, modelData.carrot.modelMatrix, [0.02, 0.02, 0.02]);

    // === Рендер морковки ===
    if (carrotState.visible) {
      mat4.multiply(modelViewMatrix, viewMatrix, modelData.carrot.modelMatrix);
      mat3.normalFromMat4(normalMatrix, modelViewMatrix);
      gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModelViewMatrix"), false, modelViewMatrix);
      gl.uniformMatrix3fv(gl.getUniformLocation(program, "uNormalMatrix"), false, normalMatrix);
      renderModelParts(gl, program, modelData.carrot.parts);
    }

    // === Рендер кофе ===
    if (coffeeState.visible) {
      mat4.multiply(modelViewMatrix, viewMatrix, modelData.coffee.modelMatrix);
      mat3.normalFromMat4(normalMatrix, modelViewMatrix);
      gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModelViewMatrix"), false, modelViewMatrix);
      gl.uniformMatrix3fv(gl.getUniformLocation(program, "uNormalMatrix"), false, normalMatrix);
      gl.uniform4fv(gl.getUniformLocation(program, "uBaseColor"), [0.6, 0.4, 0.3, 1.0]);
      gl.uniform1i(gl.getUniformLocation(program, "uUseTexture"), 0);
      renderModelParts(gl, program, modelData.coffee.parts);
    }
  },

  dispose(gl: WebGL2RenderingContext) {
    modelData = null;
    skyTexture = null;
    skySphere = null;
  },
};
