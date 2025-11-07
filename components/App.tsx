/* Главный компонент приложения */

"use client"

import {
  Grid,
  GridItem,
} from '@chakra-ui/react'
import { Provider } from "@/components/ui/provider";

import Menu from "./Menu";
import GLCanvas from './GLCanvas';
import Controls from './Controls';

import { useWebGLWorks } from '@/hooks/useWorks'

const App = () => {

  const webGLState = useWebGLWorks();

  return (
    <Provider>
      <Grid
        templateRows={'repeat(1, 1fr)'}
        templateColumns={'repeat(12, 1fr)'}
        gap={8}
        padding={4}
        paddingLeft={"2rm"}
        paddingRight={"2rm"}
        minW={1080}
        h={"100%"}
      >
        <GridItem minW={150} colSpan={2}>
          <Menu {...webGLState} />
          <Controls {...webGLState} />
        </GridItem>
        <GridItem colSpan={10}><GLCanvas {...webGLState} /></GridItem>
      </Grid>
    </Provider>
  )
}

export default App