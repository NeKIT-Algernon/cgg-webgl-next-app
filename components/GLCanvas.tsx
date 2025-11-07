"use client"

import {
  Box,
  AspectRatio,
} from '@chakra-ui/react'
import { useRef, useEffect, useState, useCallback } from "react"

function GLCanvas({ activeWork }: WebGLWorkProps) {

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gl, setGL] = useState<WebGL2RenderingContext | undefined>();
  const [customSettings, setCustomSettings] = useState({
    currentTask: 1,
    primitive: 0,
    pointSize: 10.0,
    lineThickness: 10.0,
  });

  // Разобрать
  const setupCanvasSize = useCallback((canvas: HTMLCanvasElement) => {
    const container = canvas.parentElement
    if (!container) return

    const displayWidth = container.clientWidth
    const displayHeight = container.clientHeight

    // Проверяем, нужно ли изменять размер
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth
      canvas.height = displayHeight
    }
  }, [])

// Обработчик клавиш
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (activeWork?.keyHandler) {
      // Создаем копию настроек для иммутабельности
      const newSettings = {...customSettings};
      
      // Вызываем обработчик работы
      activeWork.keyHandler(event, newSettings);
      
      // Обновляем состояние, если настройки изменились
      setCustomSettings(newSettings);
      
      // Перерисовываем сцену
      if (gl && canvasRef.current) {
        activeWork.initialize(gl, newSettings);
      }
    }
  }, [activeWork, gl, customSettings]);

  // Добавляем и удаляем обработчик событий
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    const canvas = canvasRef.current;
    setGL(canvas?.getContext?.("webgl2") ?? undefined);
    if (!gl || !canvas) {
      console.log(`Error in gl - ${gl} or canvas - ${canvas}`);
      return;
    }
    else {
      console.log(`all good in gl and canvas`);
      setupCanvasSize(canvas);
      activeWork?.initialize(gl, customSettings);
    }
  });

  return (
    <AspectRatio ratio={16 / 9} >
      <Box
        as={'canvas'}
        bg={'gray'}
        borderRadius="md"
        ref={canvasRef}
      />
    </AspectRatio>
  )
}

export default GLCanvas