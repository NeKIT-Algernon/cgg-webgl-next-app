/* Основной компонент. Именно здесь происходит отображение сцены из WebGL.
 * Также Здесь происходит обработка нажатия клавиш */

"use client"

import {
  Box,
  AspectRatio,
} from '@chakra-ui/react'
import { useRef, useEffect, useState, useCallback } from "react"

function GLCanvas({ activeWork, sceneOptions, setSceneOptions }: UseWorksType) {
  const canvasRef = useRef<HTMLCanvasElement>(null) // Ссылка на canvas
  const [gl, setGL] = useState<WebGL2RenderingContext | undefined>(); // Контекст WebGL
  
  // Установка "внутреннего" размера canvas для корректного отображения
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

  // Обработчик клавиш. Вызывает KeyHandler из activeWork при нажатии любой клавиши
  // и перерисовывает сцену, если изменились customSettings
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (activeWork?.keyHandler) {
      // Создаем копию настроек для иммутабельности
      const newSettings = { ...sceneOptions };

      // Вызываем обработчик работы
      activeWork.keyHandler(event, newSettings);

      // Обновляем состояние и перерисовываем сцену, если настройки изменились
      if (JSON.stringify(sceneOptions) !== JSON.stringify(newSettings)) {
        setSceneOptions(newSettings);

        if (gl && canvasRef.current) {
          activeWork.initialize(gl, newSettings);
        }
      }
    }
  }, [activeWork, gl, sceneOptions]);

  // Добавляем и удаляем обработчик событий
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Инициализация WebGL и canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    setGL(canvas?.getContext?.("webgl2") ?? undefined);
    if (!gl || !canvas) {
      return;
    }
    else {
      setupCanvasSize(canvas);
      activeWork?.initialize(gl, sceneOptions);
    }
  }, [activeWork, gl, sceneOptions]);

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