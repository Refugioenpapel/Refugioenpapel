'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

export default function ResumenPage() {
  const searchParams = useSearchParams();
  const numeroPedido = searchParams.get('pedido');
  const email = searchParams.get('email');

  const [products, setProducts] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);

  const aliasTransferencia = 'refugioenpapel';
  const telefonoContacto = '+54 9 11 2409 8439';

  const [checkoutInfo, setCheckoutInfo] = useState<any>(null);

useEffect(() => {
  const stored = localStorage.getItem('lastCart');
  const info = localStorage.getItem('lastCheckoutInfo');

  if (stored) {
    const parsed: CartItem[] = JSON.parse(stored);
    setProducts(parsed);
    const total = parsed.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setSubtotal(total);
    localStorage.removeItem('lastCart');
  }

  if (info) {
    setCheckoutInfo(JSON.parse(info));
    localStorage.removeItem('lastCheckoutInfo');
  }
}, []);


  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-[#A56ABF] mb-6 text-center">
        🎉 ¡Gracias por tu compra!
      </h1>

      <div className="bg-white rounded-xl shadow p-6 space-y-4 text-gray-800">
        <p><strong>Número de pedido:</strong> #{numeroPedido}</p>
        <p><strong>Correo electrónico:</strong> {email}</p>
        <p><strong>Alias para la transferencia:</strong> <span className="text-[#A084CA] font-semibold">{aliasTransferencia}</span></p>
        <p><strong>Enviar comprobante a:</strong> <span className="text-[#A084CA] font-semibold">{telefonoContacto}</span></p>

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
                      <p className="text-sm text-gray-500">x {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-right font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 font-bold text-right">
            Total: ${subtotal.toFixed(2)}
          </p>
        </div>

        <p className="text-sm text-gray-600 mt-4">
          Tu pedido será procesado una vez recibido el comprobante de pago. Te contactaremos por email para coordinar la entrega ✨
        </p>
      </div>
    </div>
  );
}