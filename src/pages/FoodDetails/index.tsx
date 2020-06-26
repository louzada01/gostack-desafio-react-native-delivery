import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  category: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);
  const [totalCart, setTotalCart] = useState(0);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const { id: foodId } = routeParams;

      const foodResponse = await api.get<Food>(`/foods/${foodId}`);

      const foodData = foodResponse.data;

      if (!foodData) {
        return;
      }

      const foodExtras = foodData.extras.map(extra => {
        return {
          ...extra,
          quantity: 0,
        };
      });

      const formattedPriceFood = {
        ...foodData,
        formattedPrice: formatValue(foodData.price),
      };

      setExtras(foodExtras);
      setFood(formattedPriceFood);

      const { data: responseFavorites } = await api.get<Food[]>('/favorites');
      const favoritesData = responseFavorites.filter(
        favorite => favorite.id === foodId,
      );
      setIsFavorite(!!favoritesData.length);
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    const extraInc = extras.map(item => {
      const extra = item;

      if (extra.id === id) {
        extra.quantity += 1;
      }

      return extra;
    });

    setExtras(extraInc);
  }

  function handleDecrementExtra(id: number): void {
    const extraDec = extras.map(item => {
      const extra = item;

      if (extra.id === id && extra.quantity > 0) {
        extra.quantity -= 1;
      }

      return extra;
    });

    setExtras(extraDec);
  }

  function handleIncrementFood(): void {
    setFoodQuantity(qtd => qtd + 1);
  }

  function handleDecrementFood(): void {
    if (foodQuantity > 1) {
      setFoodQuantity(qtd => qtd - 1);
    }
  }

  const toggleFavorite = useCallback(() => {
    if (isFavorite) {
      api.delete(`/favorites/${food.id}`);
    } else {
      const favoriteFood = food;
      delete favoriteFood.extras;
      api.post('/favorites', favoriteFood);
    }

    setIsFavorite(!isFavorite);
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    let totalExtras = 0;
    const foodTotal = foodQuantity * food.price;

    if (extras) {
      totalExtras = extras.reduce((total, extra) => {
        return total + extra.quantity * extra.value;
      }, 0);
    }

    const subTotal = foodTotal + totalExtras;

    setTotalCart(subTotal);

    return formatValue(subTotal);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    try {
      const newOrder = {
        product_id: food.id,
        name: food.name,
        description: food.description,
        price: totalCart,
        category: food.category,
        thumbnail_url: food.image_url,
        extras,
      };

      await api.post('/orders', newOrder);

      navigation.goBack();
    } catch (err) {
      console.log(err);
    }
  }

  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
