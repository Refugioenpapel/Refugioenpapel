// components/CartDrawer.tsx
'use client';

import { useCart } from '@context/CartContext';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { applyProductDiscount, extractCorreoRateAmount, sanitizeDiscountPct } from '@lib/pricing';

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
  const [cp, setCp] = useState('');
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [shippingRates, setShippingRates] = useState<{
    domicilio: number | null;
    sucursal: number | null;
  }>({ domicilio: null, sucursal: null });

  useEffect(() => {
    try {
      const storedCp = localStorage.getItem('cartShippingCp');
      if (storedCp) setCp(storedCp);
    } catch (error) {
      console.warn('No se pudo leer CP del localStorage:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('cartShippingCp', cp);
    } catch (error) {
      console.warn('No se pudo guardar CP en localStorage:', error);
    }
  }, [cp]);

  const contieneFisicos = useMemo(
    () => cartItems.some((item) => item.is_physical),
    [cartItems]
  );

  const shippingDimensions = useMemo(
    () => ({
      weight: Math.max(
        1,
        cartItems.reduce((sum, item) => sum + (item.weight ?? 1000) * item.quantity, 0)
      ),
      height: 10,
      width: 20,
      length: 30,
    }),
    [cartItems]
  );

  const safeJson = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: 'Respuesta no válida', raw: text };
    }
  };

  const getRateFor = async (deliveryType: 'domicilio' | 'sucursal') => {
    const res = await fetch('/api/correo/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinationPostalCode: cp,
        deliveryType,
        weight: shippingDimensions.weight,
        height: shippingDimensions.height,
        width: shippingDimensions.width,
        length: shippingDimensions.length,
      }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
      throw new Error(data?.error || 'No se pudo obtener la cotización');
    }

    const rateValue = extractCorreoRateAmount(data);

    if (rateValue === null || Number.isNaN(Number(rateValue))) {
      throw new Error('La respuesta de Correo Argentino no incluyó una tarifa válida');
    }

    return rateValue;
  };

  useEffect(() => {
    if (!contieneFisicos) {
      setShippingRates({ domicilio: null, sucursal: null });
      setShippingError(null);
      return;
    }

    const postalCode = cp.trim();
    if (postalCode.length < 4) {
      setShippingRates({ domicilio: null, sucursal: null });
      setShippingError(null);
      return;
    }

    let ignore = false;

    const fetchRates = async () => {
      setShippingLoading(true);
      setShippingError(null);
      setShippingRates({ domicilio: null, sucursal: null });

      try {
        const deliveryTypes: Array<'domicilio' | 'sucursal'> = [
          'domicilio',
          'sucursal',
        ];

        const results = await Promise.allSettled(
          deliveryTypes.map((deliveryType) => getRateFor(deliveryType))
        );

        const nextRates: { domicilio: number | null; sucursal: number | null } = {
          domicilio: null,
          sucursal: null,
        };
        let anySuccess = false;

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            nextRates[deliveryTypes[index]] = result.value;
            anySuccess = true;
          }
        });

        if (!ignore) {
          setShippingRates(nextRates);
          if (!anySuccess) {
            setShippingError(
              'No se pudo obtener la cotización para este CP. Revisá los datos e intentá nuevamente.'
            );
          }
        }
      } catch (error) {
        if (!ignore) {
          setShippingRates({ domicilio: null, sucursal: null });
          setShippingError(
            error instanceof Error
              ? error.message
              : 'No se pudo cotizar el envío'
          );
        }
      } finally {
        if (!ignore) {
          setShippingLoading(false);
        }
      }
    };

    fetchRates();

    return () => {
      ignore = true;
    };
  }, [contieneFisicos, cp, shippingDimensions]);

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
            className="fixed top-0 right-0 w-80 max-w-[90vw] h-dvh max-h-dvh bg-white z-50 shadow-lg p-6 flex flex-col overflow-y-auto overflow-x-hidden touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#A084CA]">Tu carrito</h2>
              <button onClick={closeCart} aria-label="Cerrar carrito">
                <X className="w-6 h-6 text-gray-600 hover:text-gray-800" />
              </button>
            </div>

            <div
              className="space-y-4"
            >
              {cartItems.length === 0 ? (
                <p className="text-gray-500">Tu carrito está vacío.</p>
              ) : (
                cartItems.map((item) => {
                  const uPrice = unitPrice(item, item.quantity); // precio unitario efectivo (con bulk si aplica)
                  const lineTotal = priceLine(item);              // subtotal de línea
                  const originalUnit = Number(item.originalPrice ?? item.price) || 0;
                  const originalLine = originalUnit * item.quantity;
                  const productDiscountPct = sanitizeDiscountPct(item.product_discount_pct);
                  const promoUnit = applyProductDiscount(originalUnit, productDiscountPct);
                  const promoLine = promoUnit * item.quantity;
                  const promoDiff = Math.max(0, originalLine - promoLine);
                  const bulkDiff = Math.max(0, promoLine - lineTotal);
                  const autoDiff = Math.max(0, originalLine - lineTotal);

                  const bulkActive =
                    item.is_physical &&
                    uPrice < promoUnit;
                  const promoActive = productDiscountPct > 0 && promoUnit < originalUnit;

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
                                {promoActive || bulkActive ? (
                                  <>
                                    <span className="line-through opacity-60">
                                      {currency(originalUnit)}
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
                              {promoActive && (
                                <span className="rounded bg-pink-100 text-pink-700 px-2 py-0.5">
                                  {productDiscountPct}% OFF
                                </span>
                              )}
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
                                {promoDiff > 0 && <p>Promoción producto: -{currency(promoDiff)}</p>}
                                {bulkDiff > 0 && <p>Descuento por cantidad: -{currency(bulkDiff)}</p>}
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
                  cartItems.reduce((acc, it) => acc + (Number(it.originalPrice ?? it.price) || 0) * it.quantity, 0)
                )}</span>
              </div>

              {cartItems.length > 0 && (
                <div className="flex justify-between text-pink-600">
                  <span>Promociones de productos:</span>
                  <span>
                    -{currency(
                      Math.max(
                        0,
                        cartItems.reduce((acc, it) => {
                          const originalUnit = Number(it.originalPrice ?? it.price) || 0;
                          const promoUnit = applyProductDiscount(originalUnit, it.product_discount_pct);
                          return acc + (originalUnit - promoUnit) * it.quantity;
                        }, 0)
                      )
                    )}
                  </span>
                </div>
              )}

              {cartItems.length > 0 && (
                <div className="flex justify-between text-[#A084CA]">
                  <span>Descuento por cantidad:</span>
                  <span>
                    -{currency(
                      Math.max(
                        0,
                        cartItems.reduce((acc, it) => {
                          const promoUnit = applyProductDiscount(it.originalPrice ?? it.price, it.product_discount_pct);
                          return acc + (promoUnit * it.quantity - priceLine(it));
                        }, 0)
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

              {contieneFisicos && (
                <div className="mt-4 rounded-3xl border border-[#E5D2ED] bg-white p-4 text-sm text-gray-700">
                  <h4 className="font-semibold text-[#A084CA] mb-3">Costo de envío</h4>
                  <div className="space-y-3 mb-3 max-w-xs">
                    <label className="block text-sm font-semibold text-gray-700">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={cp}
                      onChange={(e) => setCp(e.target.value)}
                      placeholder="Código Postal"
                      className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-base font-medium"
                    />
                    <div className="rounded-xl border border-gray-200 bg-[#F9FAFB] p-3 text-sm text-gray-600">
                      {shippingLoading ? (
                        'Cotizando envío...'
                      ) : shippingError ? (
                        <span className="text-red-600">{shippingError}</span>
                      ) : cp.trim().length < 4 ? (
                        'Ingresá al menos 4 dígitos de código postal.'
                      ) : (
                        'Costo de envío según el código postal ingresado.'
                      )}
                    </div>
                  </div>

                  {cp.trim().length >= 4 && (
                    <div className="space-y-2">
                      <div className="flex justify-between rounded-2xl border border-[#E5D2ED] bg-[#F7F2FA] p-3">
                        <span>Envío a domicilio</span>
                        <span className="font-semibold text-[#A084CA]">
                          {shippingRates.domicilio !== null
                            ? currency(shippingRates.domicilio)
                            : 'a coordinar'}
                        </span>
                      </div>
                      <div className="flex justify-between rounded-2xl border border-[#E5D2ED] bg-[#F7F2FA] p-3">
                        <span>Retiro en sucursal</span>
                        <span className="font-semibold text-[#A084CA]">
                          {shippingRates.sucursal !== null
                            ? currency(shippingRates.sucursal)
                            : 'a coordinar'}
                        </span>
                      </div>
                    </div>
                  )}

                  {cp.trim().length >= 4 && (
                    <p className="mt-3 text-xs text-gray-600">
                      La sucursal exacta se confirma en el checkout con provincia y localidad.
                    </p>
                  )}
                </div>
              )}

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
