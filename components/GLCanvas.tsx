/* components/GLCanvas.tsx */
"use client";

import { UseWorksType } from '@/types/webGLWork';
import { Box, AspectRatio } from '@chakra-ui/react';
import { useRef, useEffect, useCallback } from 'react';

function GLCanvas({ activeWork, sceneOptions, setSceneOptions }: UseWorksType) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const workRef = useRef(activeWork);
  const sceneOptionsRef = useRef(sceneOptions);
  const isInitializedRef = useRef(false);

  // Обновляем ref'ы при изменении зависимостей
  useEffect(() => {
    workRef.current = activeWork;
  }, [activeWork]);

  useEffect(() => {
    sceneOptionsRef.current = sceneOptions;
  }, [sceneOptions]);

  // Установка размера canvas
  const setupCanvasSize = useCallback((canvas: HTMLCanvasElement) => {
    const container = canvas.parentElement;
    if (!container) return;

    const displayWidth = container.clientWidth;
    const displayHeight = container.clientHeight;

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }
  }, []);

  // Инициализация (один раз)
  const initialize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setupCanvasSize(canvas);

    const gl = canvas.getContext('webgl2', { alpha: false });
    if (!gl) {
      console.error('Не удалось получить WebGL2 контекст');
      return;
    }

    glRef.current = gl;

    const work = workRef.current;
    if (work && !isInitializedRef.current) {
      work.initialize(gl, sceneOptionsRef.current);
      isInitializedRef.current = true;
    }
  }, [setupCanvasSize]);

  // Рендерим сцену
  const renderScene = useCallback(() => {
    const gl = glRef.current;
    const work = workRef.current;

    if (!gl || !work || !isInitializedRef.current) return;

    // Устанавливаем viewport и очищаем буферы
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Вызываем render
    work.render(gl, sceneOptionsRef.current);
  }, []);

  // Обработчик клавиш
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const work = workRef.current;
    if (!work?.keyHandler) return;

    const newSceneOptions = { ...sceneOptionsRef.current };
    work.keyHandler(event, newSceneOptions);

    // Если параметры изменились — обновляем состояние И рендерим
    if (JSON.stringify(sceneOptionsRef.current) !== JSON.stringify(newSceneOptions)) {
      setSceneOptions(newSceneOptions);
      renderScene(); // <- рендерим вручную
    }
  }, [setSceneOptions, renderScene]);

  // Инициализация при монтировании или смене activeWork
  useEffect(() => {
    if (activeWork && !isInitializedRef.current) {
      initialize();
    }
    return () => {
      // Очистка
      if (isInitializedRef.current) {
        const gl = glRef.current;
        if (gl && activeWork?.dispose) {
          activeWork.dispose(gl);
        }
        isInitializedRef.current = false;
      }
    };
  }, [activeWork, initialize]);

  // Подписка на keydown
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Рендер при изменении sceneOptions (например, через внешние кнопки)
  useEffect(() => {
    renderScene();
  }, [sceneOptions, renderScene]);

  return (
    <AspectRatio ratio={16 / 9}>
      <Box
        as="canvas"
        bg="gray.900"
        borderRadius="md"
        ref={canvasRef}
        tabIndex={0}
        outline="none"
      />
    </AspectRatio>
  );
}

export default GLCanvas;
