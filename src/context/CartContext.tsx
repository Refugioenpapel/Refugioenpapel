// context/CartContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  discount: number; // 0..1
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

// --- Catálogo de cupones (porcentuales) ---
// Clave en minúsculas -> porcentaje 0..1
const PERCENT_COUPONS: Record<string, number> = {
  refugio10: 0.10,
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

  const [discount, setDiscount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('discount');
      return saved ? parseFloat(saved) : 0;
    }
    return 0;
  });

  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('appliedCoupon') || null;
    }
    return null;
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Persistencia
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('discount', String(discount));
  }, [discount]);

  useEffect(() => {
    if (appliedCoupon) localStorage.setItem('appliedCoupon', appliedCoupon);
    else localStorage.removeItem('appliedCoupon');
  }, [appliedCoupon]);

  // Precios por escalado
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

  // Mutadores de carrito
  const addToCart = (item: CartItem) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((i) => i.id === item.id);
      const newQuantity = existing ? existing.quantity + item.quantity : item.quantity;
      const newPrice = calculatePrice(item, newQuantity);

      if (existing) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: newQuantity, price: newPrice } : i
        );
      }
      return [...prevItems, { ...item, price: newPrice }];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const incrementQuantity = (id: string) => {
    setCartItems((prev) =>
      prev.map((item) => {
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
    setCartItems((prev) =>
      prev.map((item) => {
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
    setCartItems((prev) =>
      prev.map((item) => {
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
    // Si querés que el cupón se mantenga aunque vacíes el carrito, comentá las dos líneas siguientes:
    setDiscount(0);
    setAppliedCoupon(null);
  };

  // Cupón porcentual (compatible con tu CartDrawer)
  const applyCoupon = (code: string) => {
    const normalized = code.trim().toLowerCase();
    const pct = PERCENT_COUPONS[normalized];

    if (!pct || pct <= 0) {
      console.log('[CartContext] Cupón inválido:', normalized);
      setDiscount(0);
      setAppliedCoupon(null);
      return;
    }

    setDiscount(pct);
    setAppliedCoupon(normalized);
    console.log(`[CartContext] Cupón aplicado: ${normalized} -> ${(pct * 100).toFixed(0)}%`);
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
  if (!context) throw new Error('useCart debe usarse dentro de un CartProvider');
  return context;
};
