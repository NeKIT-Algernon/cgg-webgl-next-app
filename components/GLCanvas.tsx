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
  const animationIdRef = useRef(0);

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

  // Рендер сцены — полагается на ref'ы, не зависит от props
  const renderScene = useCallback(() => {
    const gl = glRef.current;
    const work = workRef.current;

    if (!gl || !work || !isInitializedRef.current) return;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Если это PR6 — передаём time
    const currentTime = Date.now() * 0.001;
    const sceneOptionsToRender = work.id === "6"
      ? { ...sceneOptionsRef.current, time: currentTime }
      : sceneOptionsRef.current;

    work.render(gl, sceneOptionsToRender);
  }, []); // ✅ Остаётся стабильной

  // Обработчик клавиш
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const work = workRef.current;
    if (!work?.keyHandler) return;

    const newSceneOptions = { ...sceneOptionsRef.current };
    work.keyHandler(event, newSceneOptions);

    if (JSON.stringify(sceneOptionsRef.current) !== JSON.stringify(newSceneOptions)) {
      setSceneOptions(newSceneOptions);
    }
  }, [setSceneOptions]);

  // === Инициализация WebGL ===

useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const handleSceneReady = () => {
    renderScene();
  };

  canvas.addEventListener("sceneready", handleSceneReady);
  return () => {
    canvas.removeEventListener("sceneready", handleSceneReady);
  };
}, [renderScene]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setupCanvasSize(canvas);

    const gl = canvas.getContext('webgl2', { alpha: false });
    if (!gl) {
      console.error('Не удалось получить WebGL2 контекст');
      return;
    }

    glRef.current = gl;

    // Инициализируем только при смене активной работы
    if (workRef.current && !isInitializedRef.current) {
      workRef.current.initialize(gl, sceneOptionsRef.current);
      isInitializedRef.current = true;
    }

    // Запускаем анимацию только для PR6
    if (workRef.current?.id === "6") {
      const animate = () => {
        renderScene();
        animationIdRef.current = requestAnimationFrame(animate);
      };
      animate();
    }

    // Подписка на текстуры
    const handleTextureLoaded = () => renderScene();
    canvas.addEventListener("textureloaded", handleTextureLoaded);

    // Очистка
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (isInitializedRef.current) {
        if (gl && workRef.current?.dispose) {
          workRef.current.dispose(gl);
        }
        isInitializedRef.current = false;
      }
      canvas.removeEventListener("textureloaded", handleTextureLoaded);
    };
  }, [activeWork, setupCanvasSize]); // 🔁 Только при смене активной работы

  // === Отдельный эффект — вызов рендера при изменении sceneOptions или activeWork ===
  useEffect(() => {
    if (isInitializedRef.current && workRef.current?.id !== "6") {
      // Для всех работ, кроме PR6, просто рендерим при изменении опций
      renderScene();
    }
  }, [sceneOptions, activeWork, renderScene]);

  // Подписка на keydown
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

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
