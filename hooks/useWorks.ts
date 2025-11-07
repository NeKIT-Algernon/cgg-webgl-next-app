/* Хук для управлением состояним работы */

import { useState, useCallback } from 'react';
import { PR1 } from '../webgl-works/pr1';
import { PR2 } from '../webgl-works/pr2';
import { baseSceneOptions } from '@/types/baseObjects';

const works: WorkType[] = [
  PR1,
  PR2,
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