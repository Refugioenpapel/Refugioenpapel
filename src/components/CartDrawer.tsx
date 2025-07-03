'use client';

import { useCart } from '@context/CartContext';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const CartDrawer = () => {
  const {
    cartItems,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,
    discount,
  } = useCart();

  const [coupon, setCoupon] = useState('');

  const subtotalOriginal = cartItems.reduce((acc, item) => acc + item.originalPrice * item.quantity, 0);
  const subtotalConDescuento = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const descuentoPorCantidad = subtotalOriginal - subtotalConDescuento;
  const descuentoPorCupon = subtotalConDescuento * discount;
  const total = subtotalConDescuento - descuentoPorCupon;

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
                  const originalSubtotal = item.originalPrice * item.quantity;
                  const currentSubtotal = item.price * item.quantity;
                  const diff = originalSubtotal - currentSubtotal;

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

                          <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                            <p>Precio original: ${originalSubtotal.toFixed(2)}</p>
                            {diff > 0 && (
                              <>
                                <p>Descuento: -${diff.toFixed(2)}</p>
                                <p className="text-[#A084CA] font-medium">
                                  Total con descuento: ${currentSubtotal.toFixed(2)}
                                </p>
                              </>
                            )}
                            {!diff && (
                              <p className="text-[#A084CA] font-medium">
                                Total: ${currentSubtotal.toFixed(2)}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center mt-1 gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity === 1}
                              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
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

            <div className="mt-4 border-t pt-4 text-sm text-gray-700 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal original:</span>
                <span>${subtotalOriginal.toFixed(2)}</span>
              </div>

              {descuentoPorCantidad > 0 && (
                <div className="flex justify-between text-[#A084CA]">
                  <span>Descuento automático:</span>
                  <span>- ${descuentoPorCantidad.toFixed(2)}</span>
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento cupón ({(discount * 100).toFixed(0)}%):</span>
                  <span>- ${descuentoPorCupon.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-bold text-[#A084CA] border-t pt-2 mt-2">
                <span>Total a pagar:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

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
