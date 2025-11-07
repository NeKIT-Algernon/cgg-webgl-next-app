"use client"

import { 
    VStack, 
    Button,
    Box,
    Skeleton,
} from '@chakra-ui/react'

function Menu({works, switchWork}: WebGLWorkProps) {

  if (!works) {
    console.log(works)
    console.log(switchWork)
    return (
      <VStack spaceY={2} p={4} align="stretch">
        <Skeleton height="40px" />
        <Skeleton height="40px" />
        <Skeleton height="40px" />
      </VStack>
    )
  }

    return (
        <Box padding={2}>
            <VStack
            align={'stretch'}
            spaceY={4}
            >
                {
                works.map(w => {
                    return <Button 
                    key = {w.id} 
                    onClick={() => switchWork(`${w.id}`)}
                    >
                        {`Работа № ${w.id}`}
                    </Button>
                })
                }
            </VStack>
        </Box>
    )
}

export default Menu