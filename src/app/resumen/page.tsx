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

export default function ResumenPage() {
  const searchParams = useSearchParams();
  const numeroPedido = searchParams.get('pedido');
  const emailParam = searchParams.get('email');
  const paymentIdParam = searchParams.get('payment_id');
  const statusParam = searchParams.get('status') || searchParams.get('collection_status');

  const [products, setProducts] = useState<CartItem[]>([]);
  const [checkoutInfo, setCheckoutInfo] = useState<any>(null);

  const aliasTransferencia = 'refugioenpapel';
  const telefonoContacto = '+54 9 11 2409 8439';

  const isMP = useMemo(() => {
    const metodo = String(checkoutInfo?.metodoPago || '');
    return metodo.toLowerCase().includes('mercado pago');
  }, [checkoutInfo]);

  useEffect(() => {
    const info = localStorage.getItem('lastCheckoutInfo');
    const stored = localStorage.getItem('lastCart');

    if (info) {
      try {
        setCheckoutInfo(JSON.parse(info));
      } catch {}
    }

    if (stored) {
      try {
        setProducts(JSON.parse(stored) as CartItem[]);
      } catch {}
    }
  }, []);

  const subtotalOriginal = checkoutInfo?.subtotalOriginal
    ? parseFloat(checkoutInfo.subtotalOriginal)
    : products.reduce((acc, it) => acc + it.price * it.quantity, 0);

  const descuentoAutomatico = checkoutInfo?.descuentoAutomatico
    ? parseFloat(checkoutInfo.descuentoAutomatico)
    : 0;

  const descuentoPromocionProductos = checkoutInfo?.descuentoPromocionProductos
    ? parseFloat(checkoutInfo.descuentoPromocionProductos)
    : 0;

  const descuentoPorCantidad = checkoutInfo?.descuentoPorCantidad
    ? parseFloat(checkoutInfo.descuentoPorCantidad)
    : Math.max(0, descuentoAutomatico - descuentoPromocionProductos);

  const subtotalConAuto = checkoutInfo?.subtotalConAuto
    ? parseFloat(checkoutInfo.subtotalConAuto)
    : Math.max(0, subtotalOriginal - descuentoAutomatico);

  const descuentoCupon = checkoutInfo?.descuentoCupon
    ? parseFloat(checkoutInfo.descuentoCupon)
    : 0;

  const envio = checkoutInfo?.envio ? parseFloat(checkoutInfo.envio) : 0;

  const totalFinal = checkoutInfo?.total
    ? parseFloat(checkoutInfo.total)
    : Math.max(0, subtotalConAuto - descuentoCupon + envio);

  useEffect(() => {
    if (!isMP) return;
    if (!numeroPedido) return;

    const sentKey = `email_confirm_attempt_${numeroPedido}`;
    if (sessionStorage.getItem(sentKey) === '1') return;

    (async () => {
      try {
        const res = await fetch('/api/orders/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: numeroPedido,
            paymentId: paymentIdParam || undefined,
            status: statusParam || undefined,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error('confirm-payment failed:', data);
          return;
        }

        sessionStorage.setItem(sentKey, '1');
      } catch (error) {
        console.error('confirm-payment error:', error);
      }
    })();
  }, [isMP, numeroPedido, paymentIdParam, statusParam]);

  useEffect(() => {
    if (!checkoutInfo) return;
    if (!numeroPedido) return;

    localStorage.removeItem('lastCheckoutInfo');
    localStorage.removeItem('lastCart');
  }, [checkoutInfo, numeroPedido]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-[#A56ABF] mb-6 text-center">
        Gracias por tu compra
      </h1>

      <div className="bg-white rounded-xl shadow p-6 space-y-4 text-gray-800">
        <p>
          <strong>Numero de pedido:</strong> #{numeroPedido}
        </p>
        <p>
          <strong>Correo electronico:</strong> {emailParam || checkoutInfo?.email || ''}
        </p>

        <p>
          <strong>Metodo de pago:</strong>{' '}
          <span className="text-[#A084CA] font-semibold">{checkoutInfo?.metodoPago || '-'}</span>
        </p>

        {!isMP && (
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

        {isMP && (
          <p className="text-sm text-gray-600">
            El mail de confirmacion se envia automaticamente cuando Mercado Pago confirma el pago.
          </p>
        )}

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Resumen de productos:</h2>
          {products.length === 0 ? (
            <p>No se encontraron productos.</p>
          ) : (
            <ul className="space-y-4">
              {products.map((item) => (
                <li key={item.id} className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.variantLabel && <p className="text-xs text-gray-500">{item.variantLabel}</p>}
                      <p className="text-sm text-gray-500">x {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-right font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 text-right space-y-1">
            <p>
              Subtotal original: <strong>${subtotalOriginal.toFixed(2)}</strong>
            </p>
            {descuentoAutomatico > 0 && (
              <>
                {descuentoPromocionProductos > 0 && (
                  <p className="text-pink-600">
                    Promoción productos: <strong>-${descuentoPromocionProductos.toFixed(2)}</strong>
                  </p>
                )}
                {descuentoPorCantidad > 0 && (
                  <p className="text-[#A084CA]">
                    Descuento por cantidad: <strong>-${descuentoPorCantidad.toFixed(2)}</strong>
                  </p>
                )}
              </>
            )}
            <p>
              Subtotal: <strong>${subtotalConAuto.toFixed(2)}</strong>
            </p>
            {descuentoCupon > 0 && (
              <p className="text-green-600">
                Cupon {checkoutInfo?.cupon ? `"${checkoutInfo.cupon}"` : ''}:{' '}
                <strong>-${descuentoCupon.toFixed(2)}</strong>
              </p>
            )}
            <p>
              Envio: <strong>{envio > 0 ? `$${envio.toFixed(2)}` : 'a coordinar'}</strong>
            </p>
            <p className="text-lg font-bold mt-2">Total: ${totalFinal.toFixed(2)}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-4">
          Tu pedido sera procesado una vez confirmado el pago.
        </p>
      </div>
    </div>
  );
}
