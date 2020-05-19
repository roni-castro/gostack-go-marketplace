import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { copy } from '../utils/copyObject';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  cartTotal: number;
  totalItensInCart: number;
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const products = await AsyncStorage.getItem('@products');
      if (products) {
        setProducts(JSON.parse(products));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productFound = products.find(
        curProduct => curProduct.id === product.id,
      );
      if (productFound) {
        increment(product.id);
      } else {
        const productToBeAdded = { ...product, quantity: 1 };
        const newProducts = [...products, productToBeAdded];
        await updateProducts(newProducts);
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productsCopy: Product[] = copy(products);
      const productFound = productsCopy.find(
        curProduct => curProduct.id === id,
      );
      if (productFound) {
        productFound.quantity++;
        await updateProducts(productsCopy);
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productsCopy: Product[] = copy(products);
      const productFound = productsCopy.find(product => product.id === id);
      if (productFound) {
        productFound.quantity--;
        if (productFound.quantity === 0) {
          removeProduct(productFound.id);
        } else {
          await updateProducts(productsCopy);
        }
      }
    },
    [products],
  );

  const removeProduct = useCallback(
    async id => {
      const newProducts = products.filter(product => product.id !== id);
      await updateProducts(newProducts);
    },
    [products],
  );

  const cartTotal = useMemo(() => {
    return products.reduce((sum, cur) => sum + cur.price * cur.quantity, 0);
  }, [products]);

  const totalItensInCart = useMemo(() => {
    return products.reduce((sum, cur) => sum + cur.quantity, 0);
  }, [products]);

  const updateProducts = async (products: Product[]) => {
    setProducts(products);
    await AsyncStorage.setItem('@products', JSON.stringify(products));
  };

  const value = React.useMemo(
    () => ({
      addToCart,
      increment,
      decrement,
      products,
      cartTotal,
      totalItensInCart,
    }),
    [products, addToCart, increment, decrement, cartTotal, totalItensInCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
