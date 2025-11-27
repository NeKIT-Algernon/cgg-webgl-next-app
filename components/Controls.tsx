/* Компонент, который отвечает за подсказки по используемым в работе клавишам */

import { UseWorksType } from "@/types/webGLWork";
import { Text, Box, List } from "@chakra-ui/react"

function Controls({ activeWork }: UseWorksType) {
  
  if (!activeWork) return;

  return (
    <Box p={2} paddingTop={8}>
      <Text textStyle={{ base: "3xl", sm: "3xl", lg: "3xl", xl: "4xl" }} fontWeight={"bold"}> Controls: </Text>
      {
        (!activeWork.controls) ?
          <Text paddingTop={2}> В данной работе управление не предусмотрено </Text> :
          <List.Root paddingTop={2}>
            {activeWork.controls.map((instruction, index) => (
              <List.Item key={index}><Text>{instruction}</Text></List.Item>
            ))}
          </List.Root>
      }
    </Box>
  )
}

export default Controls