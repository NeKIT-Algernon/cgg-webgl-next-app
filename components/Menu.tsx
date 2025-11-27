/* Компонент, который предоставляет возможность переключаться между работами.
 * При этом количество кнопок зависит от количества работ, которые были импортированы в 
 * хук useWebGKWorks, а надписи на кнопках совпадают с полем name в работах */

"use client"

import { UseWorksType } from '@/types/webGLWork'
import { 
    VStack, 
    Button,
    Box,
} from '@chakra-ui/react'

function Menu({works, switchWork}: UseWorksType) {

    return (
        <Box padding={2}>
            <VStack align={'stretch'} spaceY={4}>
                {
                works.map(w => {
                    return <Button key = {w.id} onClick={() => switchWork(`${w.id}`)}>
                        {`${w.name}`}
                    </Button>
                })
                }
            </VStack>
        </Box>
    )
}

export default Menu