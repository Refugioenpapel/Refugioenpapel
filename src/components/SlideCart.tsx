'use client';

import Image from 'next/image';
import { X, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '@context/CartContext';
import { useRouter } from 'next/navigation';

export default function SlideCart() {
  const {
    isCartOpen,
    closeCart,
    cartItems,
    removeFromCart,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    discount,
  } = useCart();

  const router = useRouter();

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const descuento = subtotal * discount;
  const total = subtotal - descuento;

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm">
      <div className="w-full sm:w-[400px] bg-white h-full p-4 overflow-y-auto shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-700">Tu carrito</h2>
          <button onClick={closeCart}>
            <X className="text-gray-600 hover:text-black" />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">Tu carrito está vacío 🛒</p>
        ) : (
          <>
            <ul className="space-y-4">
  {cartItems.map((item) => {
    console.log('🛒 Item en carrito:', item); // <-- AGREGALO ASÍ
    return (
      <li key={item.id} className="flex items-start gap-3">
        <Image
          src={item.image}
          alt={item.name}
          width={64}
          height={64}
          className="rounded object-cover border border-gray-300 bg-white"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{item.name}</h3>
          <p className="text-sm text-gray-500">
            ${(item.price * item.quantity).toFixed(2)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => decrementQuantity(item.id)}>
              <Minus className="w-4 h-4 text-gray-600" />
            </button>
            <span>{item.quantity}</span>
            <button onClick={() => incrementQuantity(item.id)}>
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        <button onClick={() => removeFromCart(item.id)}>
          <Trash2 className="text-pink-500 hover:text-pink-700" />
        </button>
      </li>
    );
  })}
</ul>

            <div className="mt-6 border-t pt-4 space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Descuento</span>
                  <span>- ${descuento.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-800 text-base">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                className="bg-[#A56ABF] text-white py-2 px-4 rounded hover:bg-[#8e4fb4]"
                onClick={() => {
                  closeCart();
                  router.push('/checkout');
                }}
              >
                Iniciar compra
              </button>
              <button
                onClick={clearCart}
                className="text-sm text-gray-500 underline hover:text-gray-700"
              >
                Vaciar carrito
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
