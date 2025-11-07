//import { Dispatch, SetStateAction } from 'react';

// Тип работы
// При этом controls и keyHandler не обязательны
interface WorkType {
  id: string;
  name: string;
  controls?: string[]; // Массив из выводимых в controls подсказкам по клавишам
  keyHandler?: (event: KeyboardEvent, settings: WebGLSceneOptionsType) => void, // Обработчик клавиш
  initialize: (gl: WebGL2RenderingContext, customSettings: WebGLSceneOptionsType) => void, // Отрисовка
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
}

// Настройки рендера сцены
interface WebGLSceneOptionsType {
  currentTask: number,
  primitive: 0 | 1 | 2 | 3 | 4 | 5 | 6,
  pointSize: number,
  lineThickness: number,
}