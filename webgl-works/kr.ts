// webgl-works/kr.ts
import { WebGLSceneOptionsType, WorkType } from "@/types/webGLWork";
import {
  initializeScene,
  renderScene,
  keyHandler,
  disposeScene,
} from "./kr-src";

export const KR: WorkType = {
  id: "kr",
  name: "Курсовая",
  controls: [
    "W/A/S/D — движение морковки",
    "E — погрузить морковку",
    "R — сбросить сцену",
  ],

  keyHandler: (event: KeyboardEvent, sceneOptions: WebGLSceneOptionsType) => {
    keyHandler(event, sceneOptions);
  },

  initialize(gl, sceneOptions: WebGLSceneOptionsType) {
    initializeScene(gl, sceneOptions);
  },

  render(gl, sceneOptions: WebGLSceneOptionsType) {
    renderScene(gl, sceneOptions);
  },

  dispose(gl) {
    disposeScene(gl);
  },
};
