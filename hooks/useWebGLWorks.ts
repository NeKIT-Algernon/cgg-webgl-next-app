import { useState, useCallback } from 'react';
import { PR1 } from '../webgl-works/pr1';
import { PR2 } from '../webgl-works/pr2';

const works: WebGLWork[] = [
    PR1,
    PR2,
];

export const useWebGLWorks = () => {
  const [activeWork, setActiveWork] = useState<WebGLWork | null>(null);

  const switchWork = useCallback((workId: string) => {
    const work = works.find(w => w.id === workId);
    setActiveWork(work || null);
  }, []);

  return {
    works,
    activeWork,
    switchWork,
  };
};