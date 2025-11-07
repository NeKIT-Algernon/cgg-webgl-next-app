"use client"

import { 
  Box,
  AspectRatio,
 } from '@chakra-ui/react'
 import { useRef, useEffect, useState, useCallback } from "react"

function GLCanvas({activeWork}: WebGLWorkProps) {

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gl, setGL] = useState<WebGL2RenderingContext | undefined>();

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

  useEffect(() => {
    const canvas = canvasRef.current;
    setGL(canvas?.getContext?.("webgl2") ?? undefined);
    if (!gl || !canvas) {
      console.log(`Error in gl - ${gl} or canvas - ${canvas}`); 
      return;
    }
    else{
      console.log(`all good in gl and canvas`); 
      setupCanvasSize(canvas);
      activeWork?.initialize(gl);
    }
});

  return (
    <AspectRatio ratio={16 / 9 } >
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