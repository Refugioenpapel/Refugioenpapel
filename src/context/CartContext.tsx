// context/CartContext.tsx

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import CartDrawer from '@components/CartDrawer';

type BulkDiscount = {
  min: number;
  max: number | null;
  price: number;
};

type CartItem = {
  id: string;
  name: string;
  variantLabel?: string;
  originalPrice: number;
  price: number;
  quantity: number;
  weight?: number;
  image: string;
  is_physical?: boolean;
  bulk_discounts?: BulkDiscount[];
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

  const calculatePrice = (item: CartItem, quantity: number) => {
    if (item.is_physical && item.bulk_discounts) {
      const match = item.bulk_discounts.find((bd) => {
        const minOk = quantity >= bd.min;
        const maxOk = bd.max === null || quantity <= bd.max;
        return minOk && maxOk;
      });
      return match ? match.price : item.originalPrice;
    }
    return item.price;
  };

  const addToCart = (item: CartItem) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find(i => i.id === item.id);
      const newQuantity = existing ? existing.quantity + item.quantity : item.quantity;
      const newPrice = calculatePrice(item, newQuantity);

      if (existing) {
        return prevItems.map(i =>
          i.id === item.id
            ? { ...i, quantity: newQuantity, price: newPrice }
            : i
        );
      } else {
        return [...prevItems, { ...item, price: newPrice }];
      }
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const incrementQuantity = (id: string) => {
    setCartItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newQuantity = item.quantity + 1;
          const newPrice = calculatePrice(item, newQuantity);
          return { ...item, quantity: newQuantity, price: newPrice };
        }
        return item;
      })
    );
  };

  const decrementQuantity = (id: string) => {
    setCartItems(prev =>
      prev.map(item => {
        if (item.id === id && item.quantity > 1) {
          const newQuantity = item.quantity - 1;
          const newPrice = calculatePrice(item, newQuantity);
          return { ...item, quantity: newQuantity, price: newPrice };
        }
        return item;
      })
    );
  };

  const updateQuantity = (id: string, amount: number) => {
    const valid = Math.max(1, Math.min(100, amount));
    setCartItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newPrice = calculatePrice(item, valid);
          return { ...item, quantity: valid, price: newPrice };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscount(0);
  };

  const applyCoupon = (code: string) => {
    const normalized = code.trim().toLowerCase();

    /*
    if (normalized === 'emilia') {
      setDiscount(0.1); // 10%
    } else {
      setDiscount(0); // no válido
    }
  };
    */

  // Versión sin cupones (por ahora, quitar llave final para que funcione)
  setDiscount(0);
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
