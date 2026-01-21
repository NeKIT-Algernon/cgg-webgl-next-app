//import { Dispatch, SetStateAction } from 'react';

import { RenderModelType } from "@/types/KRtypes";
import { mat4 } from "gl-matrix";


// Тип работы
// При этом controls и keyHandler не обязательны
interface WorkType {
  id: string;
  name: string;
  initialize: (gl: WebGL2RenderingContext, customSettings: WebGLSceneOptionsType) => void; // Инициализация
  render: (gl: WebGL2RenderingContext, customSettings: WebGLSceneOptionsType) => void;
  dispose: (gl: WebGL2RenderingContext) => void;
  controls?: string[]; // Массив из выводимых в controls подсказкам по клавишам
  keyHandler?: (event: KeyboardEvent, settings: WebGLSceneOptionsType) => void; // Обработчик клавиш
}

// То, что возвращает хук. Используется для передачи вниз по дереву компонентов
interface UseWorksType {
  works: WorkType[],
  activeWork: WorkType | null;
  switchWork: (workId: string) => void;
  sceneOptions: WebGLSceneOptionsType,
  setSceneOptions: React.Dispatch<React.SetStateAction<WebGLSceneOptionsType>>,
}

// Информация о программе для дальнейшего рендера 1 фигуры
interface WebGLProgramInfoType {
  program: WebGLProgram;
  vertexCount: number;
  attribLocations: {
    vertexPosition: number;
    vertexColor: number;
  };
  uniformLocations: {
    projectionMatrix: WebGLUniformLocation | null;
    modelViewMatrix: WebGLUniformLocation | null;
    transformMatrix?: WebGLUniformLocation | null;
    pointSize?: WebGLUniformLocation | null;
  };
}

// Информация о буферах для дальнейшего рендера 1 фигуры
interface WebGLBuffersInfoType {
  position: WebGLBuffer;
  color: WebGLBuffer | null;
}

// Информация для рендера нескольких фигур
interface WebGLRenderInfoType {
  programInfoList: WebGLProgramInfoType[],
  buffersList: WebGLBuffersInfoType[],
  transformMatrices?: mat4[],
}

type CarrotState = {
  x: number;
  z: number;
  y: number;
  falling: boolean;
  speedY: number;
};

// Настройки рендера сцены
interface WebGLSceneOptionsType {
  currentTask: number,
  currentSubTask: number,
  primitive: 0 | 1 | 2 | 3 | 4 | 5 | 6,
  pointSize: number,
  angle: number,
  changed?: number,
  ready?: boolean,
  time?: number,
  modelData?: {
    carrot?: RenderModelType,
    cauldron?: RenderModelType,
  }
}

// Типы для загруженной модели
interface LoadedModel {
    vertices: number[];
    vertexNormals: number[];
    textures: number[];
    indices: number[];
    vertexCount: number;
}

export type {
  WorkType,
  UseWorksType,
  WebGLProgramInfoType,
  WebGLBuffersInfoType,
  WebGLRenderInfoType,
  WebGLSceneOptionsType,
  LoadedModel,
}