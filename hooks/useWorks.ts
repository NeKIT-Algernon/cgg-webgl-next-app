/* Хук для управлением состояним работы */

import { useState, useCallback } from 'react';
import { baseSceneOptions } from '@/types/baseObjects';
import { WebGLSceneOptionsType, WorkType } from '@/types/webGLWork';
import { PR1 } from '../webgl-works/pr1';
import { PR2 } from '../webgl-works/pr2';
import { PR3 } from '@/webgl-works/pr3';
import { PR4 } from '@/webgl-works/pr4';
import { PR5 } from '@/webgl-works/pr5';
import { PR6 } from '@/webgl-works/pr6';
import { PR7 } from '@/webgl-works/pr7';

const works: WorkType[] = [
  PR1,
  PR2,
  PR3,
  PR4,
  PR5,
  PR6,
  PR7
];

export const useWebGLWorks = () => {
  const [activeWork, setActiveWork] = useState<WorkType | null>(null);
  const [sceneOptions, setSceneOptions] = useState<WebGLSceneOptionsType>({...baseSceneOptions});

  // Переключение между работами
  const switchWork = useCallback((workId: string) => {
    const work = works.find(w => w.id === workId);
    setSceneOptions({...baseSceneOptions});
    setActiveWork(work || null);
    console.log(baseSceneOptions);
  }, []);

  return {
    works, // Массив работ
    activeWork, // Текущая работа (на canvas)
    switchWork, // Функция переключения между работами
    sceneOptions, // Базовые настройки для отображения сцен
    setSceneOptions,
  };
};