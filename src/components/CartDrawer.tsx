// components/CartDrawer.tsx
'use client';

import { useCart } from '@context/CartContext';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const currency = (n: number) => `$${n.toFixed(2)}`;

const CartDrawer = () => {
  const {
    cartItems,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,

    // 👇 nuevos helpers y totales del contexto
    unitPrice,
    priceLine,
    cartSubtotal,
    cartDiscountAmount,
    cartTotal,
    discount,
  } = useCart();

  const [coupon, setCoupon] = useState('');

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 w-80 h-full bg-white z-50 shadow-lg p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#A084CA]">Tu carrito</h2>
              <button onClick={closeCart} aria-label="Cerrar carrito">
                <X className="w-6 h-6 text-gray-600 hover:text-gray-800" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {cartItems.length === 0 ? (
                <p className="text-gray-500">Tu carrito está vacío.</p>
              ) : (
                cartItems.map((item) => {
                  const uPrice = unitPrice(item, item.quantity); // precio unitario efectivo (con bulk si aplica)
                  const lineTotal = priceLine(item);              // subtotal de línea
                  const originalLine = item.originalPrice * item.quantity;
                  const autoDiff = Math.max(0, originalLine - lineTotal);

                  const bulkActive =
                    item.is_physical &&
                    uPrice < item.originalPrice;

                  return (
                    <div key={item.id} className="border-b pb-2">
                      <div className="flex justify-between items-center">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 rounded-lg object-cover border"
                        />
                        <div className="ml-2 flex-1">
                          <h3 className="font-medium text-sm">{item.name}</h3>
                          {item.variantLabel && (
                            <p className="text-xs text-gray-500">{item.variantLabel}</p>
                          )}

                          {/* Precio unitario + badges */}
                          <div className="text-xs text-gray-600 mt-1">
                            <div className="flex items-center gap-2">
                              <span>
                                Unit.:{' '}
                                {bulkActive ? (
                                  <>
                                    <span className="line-through opacity-60">
                                      {currency(item.originalPrice)}
                                    </span>{' '}
                                    <span className="text-[#A084CA] font-semibold">
                                      {currency(uPrice)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="font-medium">
                                    {currency(uPrice)}
                                  </span>
                                )}
                              </span>
                              {bulkActive && (
                                <span className="rounded bg-[#EFE7FF] text-[#7D5BBE] px-2 py-0.5">
                                  descuento x cantidad
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Totales de la línea */}
                          <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                            <p>Subtotal original: {currency(originalLine)}</p>
                            {autoDiff > 0 ? (
                              <>
                                <p>Descuento automático: -{currency(autoDiff)}</p>
                                <p className="text-[#A084CA] font-medium">
                                  Subtotal con descuento: {currency(lineTotal)}
                                </p>
                              </>
                            ) : (
                              <p className="text-[#A084CA] font-medium">
                                Subtotal: {currency(lineTotal)}
                              </p>
                            )}
                          </div>

                          {/* Cantidad */}
                          <div className="flex items-center mt-2 gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity === 1}
                              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm disabled:opacity-50"
                            >
                              −
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                          aria-label={`Eliminar ${item.name}`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Resumen */}
            <div className="mt-4 border-t pt-4 text-sm text-gray-700 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal original:</span>
                <span>{currency(
                  cartItems.reduce((acc, it) => acc + it.originalPrice * it.quantity, 0)
                )}</span>
              </div>

              {cartItems.length > 0 && (
                <div className="flex justify-between text-[#A084CA]">
                  <span>Descuento automático:</span>
                  <span>
                    -{currency(
                      Math.max(
                        0,
                        cartItems.reduce((acc, it) => acc + (it.originalPrice * it.quantity - priceLine(it)), 0)
                      )
                    )}
                  </span>
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento cupón ({(discount * 100).toFixed(0)}%):</span>
                  <span>-{currency(cartDiscountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal:</span>
                <span>{currency(cartSubtotal)}</span>
              </div>

              <div className="flex justify-between text-base font-bold text-[#A084CA] border-t pt-2 mt-2">
                <span>Total a pagar:</span>
                <span>{currency(cartTotal)}</span>
              </div>
            </div>

            {/* Cupón */}
            <div className="mt-4">
              <input
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Agregar cupón"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A084CA]"
              />
              <button
                onClick={() => applyCoupon(coupon)}
                className="mt-2 w-full bg-[#D1B3FF] text-white py-2 rounded-lg hover:bg-[#BFA2E0] transition"
              >
                Aplicar cupón
              </button>
            </div>

            {/* Acciones */}
            <div className="mt-4 space-y-2">
              <button
                onClick={clearCart}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
              >
                Vaciar carrito
              </button>
              <Link href="/checkout" onClick={closeCart}>
                <button className="w-full bg-[#A084CA] text-white py-2 rounded-lg hover:bg-[#8C6ABF] transition">
                  Iniciar compra
                </button>
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
