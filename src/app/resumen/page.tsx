'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variantLabel?: string;
};

type CheckoutInfo = {
  // básicos
  order_id?: number | string;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;

  // método de pago + descuentos
  metodoPago?: string; // "Transferencia bancaria (10% OFF)" | "Mercado Pago"
  descuentoTransferencia?: string; // monto en string "123.45"

  // desglose guardado
  subtotalOriginal?: string;
  descuentoAutomatico?: string;
  subtotalConAuto?: string;
  descuentoCupon?: string;
  envio?: string;
  total?: string;

  // cupón (opcional)
  cupon?: string;
};

export default function ResumenPage() {
  const searchParams = useSearchParams();
  const numeroPedido = searchParams.get('pedido');
  const email = searchParams.get('email');

  const [products, setProducts] = useState<CartItem[]>([]);
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null);

  const aliasTransferencia = 'refugioenpapel';
  const telefonoContacto = '+54 9 11 2409 8439';

  useEffect(() => {
    const info = localStorage.getItem('lastCheckoutInfo');
    const stored = localStorage.getItem('lastCart');

    if (info) {
      try {
        const parsedInfo = JSON.parse(info) as CheckoutInfo;
        setCheckoutInfo(parsedInfo);
      } catch {}
      localStorage.removeItem('lastCheckoutInfo');
    }

    if (stored) {
      try {
        const parsedCart = JSON.parse(stored) as CartItem[];
        setProducts(parsedCart);
      } catch {}
      localStorage.removeItem('lastCart');
    }
  }, []);

  // ✅ Método de pago
  const metodoPago = checkoutInfo?.metodoPago || 'Transferencia bancaria (10% OFF)';
  const esTransferencia = /transferencia/i.test(metodoPago);
  const esMercadoPago = /mercado\s*pago/i.test(metodoPago);

  // Fallbacks si no vino info completa
  const subtotalOriginal = useMemo(() => {
    return checkoutInfo?.subtotalOriginal
      ? parseFloat(checkoutInfo.subtotalOriginal)
      : products.reduce((acc, it) => acc + it.price * it.quantity, 0);
  }, [checkoutInfo?.subtotalOriginal, products]);

  const descuentoAutomatico = useMemo(() => {
    return checkoutInfo?.descuentoAutomatico ? parseFloat(checkoutInfo.descuentoAutomatico) : 0;
  }, [checkoutInfo?.descuentoAutomatico]);

  const subtotalConAuto = useMemo(() => {
    return checkoutInfo?.subtotalConAuto
      ? parseFloat(checkoutInfo.subtotalConAuto)
      : Math.max(0, subtotalOriginal - descuentoAutomatico);
  }, [checkoutInfo?.subtotalConAuto, subtotalOriginal, descuentoAutomatico]);

  const descuentoCupon = useMemo(() => {
    return checkoutInfo?.descuentoCupon ? parseFloat(checkoutInfo.descuentoCupon) : 0;
  }, [checkoutInfo?.descuentoCupon]);

  // ✅ Descuento transferencia (monto) si aplica
  const descuentoTransferencia = useMemo(() => {
    if (!esTransferencia) return 0;
    return checkoutInfo?.descuentoTransferencia ? parseFloat(checkoutInfo.descuentoTransferencia) : 0;
  }, [esTransferencia, checkoutInfo?.descuentoTransferencia]);

  const envio = useMemo(() => {
    return checkoutInfo?.envio ? parseFloat(checkoutInfo.envio) : 0;
  }, [checkoutInfo?.envio]);

  const totalFinal = useMemo(() => {
    // si vino total desde checkout, lo respetamos
    if (checkoutInfo?.total) return parseFloat(checkoutInfo.total);

    // cálculo fallback
    return Math.max(0, subtotalConAuto - descuentoCupon - descuentoTransferencia + envio);
  }, [checkoutInfo?.total, subtotalConAuto, descuentoCupon, descuentoTransferencia, envio]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-[#A56ABF] mb-6 text-center">
        🎉 ¡Gracias por tu compra!
      </h1>

      <div className="bg-white rounded-xl shadow p-6 space-y-4 text-gray-800">
        <p>
          <strong>Número de pedido:</strong> #{numeroPedido}
        </p>
        <p>
          <strong>Correo electrónico:</strong> {email}
        </p>

        {/* ✅ Método de pago */}
        <p>
          <strong>Método de pago:</strong>{' '}
          <span className="text-[#A084CA] font-semibold">{metodoPago}</span>
        </p>

        {/* ✅ Transferencia: mostrar alias + WhatsApp */}
        {esTransferencia && (
          <>
            <p>
              <strong>Alias para la transferencia:</strong>{' '}
              <span className="text-[#A084CA] font-semibold">{aliasTransferencia}</span>
            </p>
            <p>
              <strong>Enviar comprobante a:</strong>{' '}
              <span className="text-[#A084CA] font-semibold">{telefonoContacto}</span>
            </p>
          </>
        )}

        {/* ✅ MercadoPago: no mostrar alias */}
        {esMercadoPago && (
          <p className="text-sm text-gray-600">
            En el próximo paso, al integrar Mercado Pago, acá se mostrará el estado del pago (aprobado / pendiente / rechazado)
            y el comprobante si corresponde.
          </p>
        )}

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Resumen de productos:</h2>

          {products.length === 0 ? (
            <p>No se encontraron productos.</p>
          ) : (
            <ul className="space-y-4">
              {products.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.variantLabel && (
                        <p className="text-xs text-gray-500">{item.variantLabel}</p>
                      )}
                      <p className="text-sm text-gray-500">x {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-right font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {/* Desglose */}
          <div className="mt-4 text-right space-y-1">
            <p>
              Subtotal original: <strong>${subtotalOriginal.toFixed(2)}</strong>
            </p>

            {descuentoAutomatico > 0 && (
              <p className="text-[#A084CA]">
                Descuento automático:{' '}
                <strong>-${descuentoAutomatico.toFixed(2)}</strong>
              </p>
            )}

            <p>
              Subtotal: <strong>${subtotalConAuto.toFixed(2)}</strong>
            </p>

            {descuentoCupon > 0 && (
              <p className="text-green-600">
                Cupón {checkoutInfo?.cupon ? `"${checkoutInfo.cupon}"` : ''}:{' '}
                <strong>-${descuentoCupon.toFixed(2)}</strong>
              </p>
            )}

            {/* ✅ Transferencia -10% */}
            {esTransferencia && descuentoTransferencia > 0 && (
              <p className="text-green-700">
                Descuento transferencia (10%):{' '}
                <strong>-${descuentoTransferencia.toFixed(2)}</strong>
              </p>
            )}

            <p>
              Envío:{' '}
              <strong>{envio > 0 ? `$${envio.toFixed(2)}` : 'a coordinar'}</strong>
            </p>

            <p className="text-lg font-bold mt-2">Total: ${totalFinal.toFixed(2)}</p>
          </div>
        </div>

        {/* Texto final según método */}
        {esTransferencia ? (
          <p className="text-sm text-gray-600 mt-4">
            Tu pedido será procesado una vez recibido el comprobante de pago. Te contactaremos por email para coordinar la entrega ✨
          </p>
        ) : (
          <p className="text-sm text-gray-600 mt-4">
            Si elegiste Mercado Pago, cuando lo conectemos vas a ver acá el estado del pago automáticamente ✨
          </p>
        )}
      </div>
    </div>
  );
}
