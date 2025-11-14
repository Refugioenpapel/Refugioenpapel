// context/CartContext.tsx
'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
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

  // precios
  originalPrice: number; // precio base unitario (sin descuentos)
  price: number;         // precio unitario efectivo (actualizado según qty y reglas bulk)

  quantity: number;
  weight?: number;
  image: string;

  // flags/campos de producto
  is_physical?: boolean;

  // LEGACY (compat): tramos por cantidad con precio final unitario
  bulk_discounts?: BulkDiscount[];

  // NUEVO esquema: umbral + %
  bulk_threshold_qty?: number | null; // ej: 25
  bulk_discount_pct?: number | null;  // ej: 10 (%)
};

type CartContextType = {
  cartItems: CartItem[];

  // totales (sin y con cupón)
  cartSubtotal: number;        // suma de lineas (ya con bulk)
  cartDiscountAmount: number;  // monto descontado por cupón
  cartTotal: number;           // subtotal - cupón

  // helpers de línea (por si los querés usar en el Drawer)
  priceLine: (item: CartItem) => number;
  unitPrice: (item: CartItem, quantity?: number) => number;

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

  appliedCoupon: string | null;
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

  /**
   * Calcula el precio unitario efectivo según:
   * 1) Legacy bulk_discounts (si existen) -> prioriza ese tramo
   * 2) Nuevo esquema: si es físico y qty >= bulk_threshold_qty => aplica % sobre originalPrice
   * 3) Caso base: originalPrice
   */
  const unitPrice = (item: CartItem, quantity?: number): number => {
    const qty = quantity ?? item.quantity;
    const base = Number(item.originalPrice) || 0;

    // 1) LEGACY por tramos de precio
    if (item.is_physical && Array.isArray(item.bulk_discounts) && item.bulk_discounts.length > 0) {
      const match = item.bulk_discounts.find((bd) => {
        const minOk = qty >= bd.min;
        const maxOk = bd.max == null || qty <= bd.max;
        return minOk && maxOk;
      });
      if (match) return Number(match.price) || base;
      return base;
    }

    // 2) NUEVO umbral + %
    if (item.is_physical && item.bulk_threshold_qty && item.bulk_discount_pct) {
      if (qty >= item.bulk_threshold_qty) {
        const pct = Math.min(Math.max(item.bulk_discount_pct, 0), 100) / 100; // 0..1
        const discounted = base * (1 - pct);
        return Number(discounted.toFixed(2));
      }
    }

    // 3) sin descuentos por cantidad
    return base;
  };

  // Subtotal de una línea (sin cupón — ya contempla bulk)
  const priceLine = (item: CartItem): number => {
    return Number((unitPrice(item, item.quantity) * item.quantity).toFixed(2));
  };

  // Totales del carrito (memo para performance)
  const cartSubtotal = useMemo(() => {
    return Number(
      cartItems.reduce((sum, it) => sum + priceLine(it), 0).toFixed(2)
    );
  }, [cartItems]);

  // Monto descontado por cupón (porcentaje sobre subtotal)
  const cartDiscountAmount = useMemo(() => {
    const pct = Math.min(Math.max(discount, 0), 1);
    return Number((cartSubtotal * pct).toFixed(2));
  }, [cartSubtotal, discount]);

  const cartTotal = useMemo(() => {
    return Number((cartSubtotal - cartDiscountAmount).toFixed(2));
  }, [cartSubtotal, cartDiscountAmount]);

  // Mutadores del carrito

  const addToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      const newQuantity = existing ? existing.quantity + item.quantity : item.quantity;
      const effectiveUnit = unitPrice(item, newQuantity);

      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: newQuantity, price: effectiveUnit }
            : i
        );
      }
      return [...prev, { ...item, price: effectiveUnit }];
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
          const newUnit = unitPrice(item, newQuantity);
          return { ...item, quantity: newQuantity, price: newUnit };
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
          const newUnit = unitPrice(item, newQuantity);
          return { ...item, quantity: newQuantity, price: newUnit };
        }
        return item;
      })
    );
  };

  const updateQuantity = (id: string, amount: number) => {
    const valid = Math.max(1, Math.min(1000, amount));
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newUnit = unitPrice(item, valid);
          return { ...item, quantity: valid, price: newUnit };
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

  // Cupón porcentual (aplicado sobre el subtotal ya con bulk)
  const applyCoupon = (code: string) => {
    const normalized = code.trim().toLowerCase();
    const pct = PERCENT_COUPONS[normalized];

    if (!pct || pct <= 0) {
      setDiscount(0);
      setAppliedCoupon(null);
      return;
    }

    setDiscount(pct);
    setAppliedCoupon(normalized);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,

        cartSubtotal,
        cartDiscountAmount,
        cartTotal,

        priceLine,
        unitPrice,

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

        appliedCoupon,
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
