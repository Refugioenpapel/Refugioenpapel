'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import CartDrawer from '@components/CartDrawer'; // ⬅️ nuevo import

type CartItem = {
  id: string;
  name: string;
  variantLabel?: string;
  originalPrice: number; // precio real (sin descuento)
  price: number;         // con descuento aplicado
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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => {
    console.log('abrir carrito'); // Útil para depuración
    setIsCartOpen(true);
  };

  const closeCart = () => setIsCartOpen(false);

  const addToCart = (item: CartItem) => {
  setCartItems((prevItems) => {
    const existingItem = prevItems.find((i) => i.id === item.id);
    if (existingItem) {
      return prevItems.map((i) =>
        i.id === item.id
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
      );
    } else {
      return [...prevItems, item];
    }
  });
};

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const incrementQuantity = (id: string) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decrementQuantity = (id: string) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const updateQuantity = (id: string, amount: number) => {
    const validatedAmount = Math.max(1, Math.min(10, amount));
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: validatedAmount } : item
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
      <CartDrawer /> {/* el carrito global */}
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
