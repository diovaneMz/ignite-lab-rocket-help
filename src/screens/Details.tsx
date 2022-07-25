import { useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { VStack, Text, HStack, useTheme, ScrollView, Box } from "native-base";
import { CircleWavyCheck, ClipboardText, DesktopTower, Hourglass } from 'phosphor-react-native';

import { DateFormat } from '../utils/firestoreDateFormat';
import { OrderFirestoreDTO } from '../DTOs/OrderFirestoreDTO';

import { Header } from "../components/Header";
import { OrderProps } from '../components/Order';
import { Loading } from '../components/Loading';
import { CardDetails } from '../components/CardDetails';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Alert } from 'react-native';

type RouteParams = {
  orderId: string;
}

type OrderDetail = OrderProps & {
  description: string;
  solution: string;
  closed: string;
}

export function Details() {
  const [solution, setSolution] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [order, setOrder] = useState<OrderDetail>({} as OrderDetail)
  
  const navigation = useNavigation()
  
  const { colors } = useTheme()
  
  const route = useRoute()
  const { orderId } = route.params as RouteParams

  function handleOrderClose() {
    if(!solution) {
      return Alert.alert('Solicitação', 'Informe a solução para encerrar solicitação.')
    }

    firestore()
      .collection<OrderFirestoreDTO>('orders')
      .doc(orderId)
      .update({ 
        status: 'closed',
        closed_at: firestore.FieldValue.serverTimestamp(),
        solution,
      })
      .then(resp => {
        Alert.alert('Solicitação', 'Solicitação encerrada.')
        navigation.goBack()
      })
      .catch(err => {
        console.log(err)
        Alert.alert('Solicitação', 'Não foi possivel encerrar a solicitação.')
      })
  }

  useEffect(() => {
    firestore()
      .collection<OrderFirestoreDTO>('orders')
      .doc(orderId)
      .get()
      .then((doc) => {
        const { patrimony, description, status, created_at, closed_at, solution } = doc.data()

        const closed = closed_at ? DateFormat(closed_at) : null

        setOrder({
          id: doc.id,
          patrimony,
          description,
          status,
          solution,
          when: DateFormat(created_at),
          closed
        })

        setIsLoading(false)
      })
      
  }, [])

  if(isLoading) {
    return <Loading />
  }
  
  return (
    <VStack flex={1} bg="gray.700">
      <Box px={6} bg='gray.600' >
        <Header title="Solicitação" />
      </Box>

      <HStack bg="gray.500" justifyContent="center" p={4}>
        {order.status === "closed" ? (
          <CircleWavyCheck size={22} color={colors.green[300]} />
        ) : (
          <Hourglass size={22} color={colors.secondary[700]} />
        )}

        <Text
          fontSize="sm"
          color={order.status === "closed" ? colors.green[300] : colors.secondary[700]}
          ml={2}
          textTransform="uppercase"
        >
          {order.status === "closed" ? "finalizado" : "em andamento"}
        </Text>
      </HStack>

      <ScrollView mx={5} showsVerticalScrollIndicator={false} >
        <CardDetails 
          title='equipamento' 
          description={`Patrimônio ${order.patrimony}`}
          icon={DesktopTower}
        />

        <CardDetails 
          title='descrição do problema' 
          description={order.description}
          icon={ClipboardText}
          footer={`Registrado em ${order.when}`}
        />

        <CardDetails 
          title='solução' 
          icon={CircleWavyCheck}
          description={order.solution}
          footer={order.closed && `Encerrado em ${order.closed}`}
        >
          {
            order.status === 'open' &&
            <Input 
              placeholder='Descrição da solução'
              onChangeText={setSolution}
              textAlignVertical='top'
              multiline
              h={24}
            />
          }
        </CardDetails>
      </ScrollView>

      {
        order.status === 'open' && <Button title='Encerrar solicitação' m={5} onPress={handleOrderClose}/>
      }
    </VStack>
  );
}