'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import CartDrawer from '@components/CartDrawer';

type CartItem = {
  id: string;
  name: string;
  variantLabel?: string;
  originalPrice: number;
  price: number;
  quantity: number;
  image: string;
};

type CartContextType = {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  incrementQuantity: (id: string) => void;
  decrementQuantity: (id: string) => void;
  updateQuantity: (id: string, amount: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => void;
  discount: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cart');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log('[CartContext] Carrito cargado en useState:', parsed);
          return parsed;
        } catch (e) {
          console.error('[CartContext] Error al parsear carrito:', e);
        }
      }
    }
    return [];
  });

  const [discount, setDiscount] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('discount');
      return saved ? parseFloat(saved) : 0;
    }
    return 0;
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => {
    console.log('[CartContext] Abrir carrito');
    setIsCartOpen(true);
  };

  const closeCart = () => setIsCartOpen(false);

  const saveCartToStorage = (items: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(items));
    console.log('[CartContext] Carrito guardado:', items);
  };

  const saveDiscountToStorage = (value: number) => {
    localStorage.setItem('discount', value.toString());
    console.log('[CartContext] Descuento guardado:', value);
  };

  useEffect(() => {
    saveCartToStorage(cartItems);
  }, [cartItems]);

  useEffect(() => {
    saveDiscountToStorage(discount);
  }, [discount]);

  const addToCart = (item: CartItem) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find(i => i.id === item.id);
      if (existing) {
        return prevItems.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      } else {
        return [...prevItems, item];
      }
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const incrementQuantity = (id: string) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decrementQuantity = (id: string) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const updateQuantity = (id: string, amount: number) => {
    const valid = Math.max(1, Math.min(10, amount));
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity: valid } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscount(0);
  };

  const applyCoupon = (code: string) => {
    if (code === 'DESCUENTO10') {
      setDiscount(0.1);
    } else {
      setDiscount(0);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        incrementQuantity,
        decrementQuantity,
        updateQuantity,
        clearCart,
        applyCoupon,
        discount,
        isCartOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de un CartProvider');
  }
  return context;
};
