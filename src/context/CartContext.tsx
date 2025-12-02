// context/CartContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import CartDrawer from "@components/CartDrawer";
import { fetchCouponByCode } from "@lib/supabase/coupons"; // 👈 NUEVO

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

  bulk_threshold_qty?: number | null;
  bulk_discount_pct?: number | null;
};

type CartContextType = {
  cartItems: CartItem[];

  cartSubtotal: number;
  cartDiscountAmount: number;
  cartTotal: number;

  priceLine: (item: CartItem) => number;
  unitPrice: (item: CartItem, quantity?: number) => number;

  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  incrementQuantity: (id: string) => void;
  decrementQuantity: (id: string) => void;
  updateQuantity: (id: string, amount: number) => void;
  clearCart: () => void;

  applyCoupon: (code: string) => void; // sigue siendo void
  discount: number;

  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;

  appliedCoupon: string | null;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cart");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error("[CartContext] Error al parsear carrito:", e);
        }
      }
    }
    return [];
  });

  const [discount, setDiscount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("discount");
      return saved ? parseFloat(saved) : 0;
    }
    return 0;
  });

  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("appliedCoupon") || null;
    }
    return null;
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem("discount", String(discount));
  }, [discount]);

  useEffect(() => {
    if (appliedCoupon) localStorage.setItem("appliedCoupon", appliedCoupon);
    else localStorage.removeItem("appliedCoupon");
  }, [appliedCoupon]);

  const unitPrice = (item: CartItem, quantity?: number): number => {
    const qty = quantity ?? item.quantity;
    const base = Number(item.originalPrice) || 0;

    if (
      item.is_physical &&
      Array.isArray(item.bulk_discounts) &&
      item.bulk_discounts.length > 0
    ) {
      const match = item.bulk_discounts.find((bd) => {
        const minOk = qty >= bd.min;
        const maxOk = bd.max == null || qty <= bd.max;
        return minOk && maxOk;
      });
      if (match) return Number(match.price) || base;
      return base;
    }

    if (item.is_physical && item.bulk_threshold_qty && item.bulk_discount_pct) {
      if (qty >= item.bulk_threshold_qty) {
        const pct = Math.min(
          Math.max(item.bulk_discount_pct, 0),
          100
        ) / 100;
        const discounted = base * (1 - pct);
        return Number(discounted.toFixed(2));
      }
    }

    return base;
  };

  const priceLine = (item: CartItem): number => {
    return Number(
      (unitPrice(item, item.quantity) * item.quantity).toFixed(2)
    );
  };

  const cartSubtotal = useMemo(() => {
    return Number(
      cartItems.reduce((sum, it) => sum + priceLine(it), 0).toFixed(2)
    );
  }, [cartItems]);

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
      const newQuantity = existing
        ? existing.quantity + item.quantity
        : item.quantity;
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
    setDiscount(0);
    setAppliedCoupon(null);
  };

  // 🔽 Cupón porcentual dinámico (Supabase)
  const applyCoupon = (code: string) => {
    const normalized = code.trim();

    if (!normalized) {
      setDiscount(0);
      setAppliedCoupon(null);
      return;
    }

    (async () => {
      try {
        const coupon = await fetchCouponByCode(normalized);
        if (!coupon || !coupon.is_active) {
          // código inválido o inactivo
          setDiscount(0);
          setAppliedCoupon(null);
          return;
        }

        const pct = Math.min(
          Math.max(coupon.discount_pct, 0),
          100
        ) / 100; // 0..1

        setDiscount(pct);
        // guardamos el code tal cual está en la BD (por si usás mayúsculas)
        setAppliedCoupon(coupon.code);
      } catch (err) {
        console.error("[CartContext] applyCoupon error:", err);
        setDiscount(0);
        setAppliedCoupon(null);
      }
    })();
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
  if (!context)
    throw new Error("useCart debe usarse dentro de un CartProvider");
  return context;
};
