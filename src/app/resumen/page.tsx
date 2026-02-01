'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import emailjs from 'emailjs-com';

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

  const [products, setProducts] = useState<CartItem[]>([]);
  const [checkoutInfo, setCheckoutInfo] = useState<any>(null);

  const aliasTransferencia = 'refugioenpapel';
  const telefonoContacto = '+54 9 11 2409 8439';

  // Helpers
  const isMP = useMemo(() => {
    const metodo = String(checkoutInfo?.metodoPago || '');
    return metodo.toLowerCase().includes('mercado pago');
  }, [checkoutInfo]);

  useEffect(() => {
    const info = localStorage.getItem('lastCheckoutInfo');
    const stored = localStorage.getItem('lastCart');

    if (info) {
      try {
        const parsedInfo = JSON.parse(info);
        setCheckoutInfo(parsedInfo);
      } catch {}
    }

    if (stored) {
      try {
        const parsedCart = JSON.parse(stored) as CartItem[];
        setProducts(parsedCart);
      } catch {}
    }
  }, []);

  // Fallbacks si no vino info completa
  const subtotalOriginal =
    checkoutInfo?.subtotalOriginal
      ? parseFloat(checkoutInfo.subtotalOriginal)
      : products.reduce((acc, it) => acc + it.price * it.quantity, 0);

  const descuentoAutomatico = checkoutInfo?.descuentoAutomatico
    ? parseFloat(checkoutInfo.descuentoAutomatico)
    : 0;

  const subtotalConAuto =
    checkoutInfo?.subtotalConAuto
      ? parseFloat(checkoutInfo.subtotalConAuto)
      : Math.max(0, subtotalOriginal - descuentoAutomatico);

  const descuentoCupon = checkoutInfo?.descuentoCupon
    ? parseFloat(checkoutInfo.descuentoCupon)
    : 0;

  const envio = checkoutInfo?.envio
    ? parseFloat(checkoutInfo.envio)
    : 0;

  const totalFinal = checkoutInfo?.total
    ? parseFloat(checkoutInfo.total)
    : Math.max(0, subtotalConAuto - descuentoCupon + envio);

  // ✅ Enviar email al volver de MP (solo 1 vez por pedido)
  useEffect(() => {
    if (!checkoutInfo) return;
    if (!numeroPedido) return;

    // Solo para MP (transferencia ya lo manda en /checkout)
    const metodo = String(checkoutInfo?.metodoPago || '');
    const isMercadoPago = metodo.toLowerCase().includes('mercado pago');
    if (!isMercadoPago) return;

    const sentKey = `email_sent_${numeroPedido}`;
    const alreadySent = localStorage.getItem(sentKey);
    if (alreadySent === '1') return;

    (async () => {
      try {
        // En algunos casos email viene por URL, en otros por checkoutInfo
        const finalEmail = checkoutInfo?.email || emailParam || '';

        const templateParams = {
          ...checkoutInfo,
          email: finalEmail,
          order_id: numeroPedido,
        };

        await emailjs.send(
          'service_wg78xcn',
          'template_b529mq6',
          templateParams,
          'cHz6pQf3uU5jTYI48'
        );

        localStorage.setItem(sentKey, '1');

        // Si querés limpiar storage recién cuando mandó el mail:
        localStorage.removeItem('lastCheckoutInfo');
        localStorage.removeItem('lastCart');
      } catch (err) {
        console.error('Error enviando email (MP):', err);
        // No limpies storage si falló, así podés reintentar
      }
    })();
  }, [checkoutInfo, numeroPedido, emailParam]);

  // Si NO es MP, limpiamos storage como antes (pero solo cuando ya cargó)
  useEffect(() => {
    if (!checkoutInfo) return;
    if (!numeroPedido) return;

    const metodo = String(checkoutInfo?.metodoPago || '');
    const isMercadoPago = metodo.toLowerCase().includes('mercado pago');
    if (isMercadoPago) return;

    // Transferencia u otros: limpiar una vez cargado
    localStorage.removeItem('lastCheckoutInfo');
    localStorage.removeItem('lastCart');
  }, [checkoutInfo, numeroPedido]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-[#A56ABF] mb-6 text-center">
        🎉 ¡Gracias por tu compra!
      </h1>

      <div className="bg-white rounded-xl shadow p-6 space-y-4 text-gray-800">
        <p><strong>Número de pedido:</strong> #{numeroPedido}</p>
        <p><strong>Correo electrónico:</strong> {emailParam || checkoutInfo?.email || ''}</p>

        <p>
          <strong>Método de pago:</strong>{' '}
          <span className="text-[#A084CA] font-semibold">
            {checkoutInfo?.metodoPago || '—'}
          </span>
        </p>

        {!isMP && (
          <>
            <p><strong>Alias para la transferencia:</strong> <span className="text-[#A084CA] font-semibold">{aliasTransferencia}</span></p>
            <p><strong>Enviar comprobante a:</strong> <span className="text-[#A084CA] font-semibold">{telefonoContacto}</span></p>
          </>
        )}

        {isMP && (
          <p className="text-sm text-gray-600">
            Si pagaste con Mercado Pago, el mail se envía automáticamente al volver del pago ✅
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
            <p>Subtotal original: <strong>${subtotalOriginal.toFixed(2)}</strong></p>
            {descuentoAutomatico > 0 && (
              <p className="text-[#A084CA]">Descuento automático: <strong>-${descuentoAutomatico.toFixed(2)}</strong></p>
            )}
            <p>Subtotal: <strong>${subtotalConAuto.toFixed(2)}</strong></p>
            {descuentoCupon > 0 && (
              <p className="text-green-600">
                Cupón {checkoutInfo?.cupon ? `"${checkoutInfo.cupon}"` : ''}: <strong>-${descuentoCupon.toFixed(2)}</strong>
              </p>
            )}
            <p>Envío: <strong>{envio > 0 ? `$${envio.toFixed(2)}` : 'a coordinar'}</strong></p>
            <p className="text-lg font-bold mt-2">Total: ${totalFinal.toFixed(2)}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-4">
          Tu pedido será procesado una vez confirmado el pago. Te contactaremos por email para coordinar la entrega ✨
        </p>
      </div>
    </div>
  );
}
