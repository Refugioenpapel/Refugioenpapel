// app/checkout/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import emailjs from 'emailjs-com';
import { useCart } from '@context/CartContext';

type PaymentMethod = 'mp' | 'transfer';

export default function CheckoutPage() {
  const router = useRouter();

  const {
    cartItems,
    clearCart,
    openCart,

    // totales del contexto
    cartSubtotal, // subtotal ya con descuentos por cantidad
    cartDiscountAmount, // monto de cupón
    cartTotal, // total final (sin envío)
    discount, // 0..1
    appliedCoupon,
    priceLine,
  } = useCart();

  const contieneFisicos = useMemo(
    () => cartItems.some((item) => item.is_physical),
    [cartItems]
  );

  const subtotalOriginal = useMemo(
    () => cartItems.reduce((acc, it) => acc + it.originalPrice * it.quantity, 0),
    [cartItems]
  );

  const descuentoAutomatico = useMemo(
    () =>
      Math.max(
        0,
        cartItems.reduce((acc, it) => acc + (it.originalPrice * it.quantity - priceLine(it)), 0)
      ),
    [cartItems, priceLine]
  );

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mp');

  // ✅ Ahora pedimos SIEMPRE dirección completa (para cualquier pedido)
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    mensaje: '',
    evento: '',
    nombrePersonalizado: '',
    edad: '',
    fechaHora: '',
    direccioninvitacion: '',

    // 📦 Dirección / entrega (SIEMPRE)
    metodoEntrega: 'sucursal', // 'sucursal' | 'domicilio'
    provincia: '',
    localidad: '',
    cp: '',
    calle: '',
    numero: '',
    piso: '',
    departamento: '',
    barrio: '',
  });

  const [loading, setLoading] = useState(false);
  const [envioPrecio, setEnvioPrecio] = useState<number | null>(null);

  // 10% OFF transferencia (aplicado sobre el total del carrito SIN envío)
  const transferDiscountPct = 0.10;
  const transferenciaDescuentoMonto = useMemo(() => {
    if (paymentMethod !== 'transfer') return 0;
    return Math.max(0, cartTotal * transferDiscountPct);
  }, [paymentMethod, cartTotal]);

  const envioFinal = envioPrecio || 0;

  const totalFinal = useMemo(() => {
    const base = cartTotal - transferenciaDescuentoMonto;
    return Math.max(0, base + envioFinal);
  }, [cartTotal, transferenciaDescuentoMonto, envioFinal]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    // a futuro: cotizador Correo Argentino
    setEnvioPrecio(null);
  }, []);

  const buildResumenProductos = () =>
    cartItems
      .map(
        (it) =>
          `• ${it.name}${it.variantLabel ? ` (${it.variantLabel})` : ''} x${it.quantity} – $${(
            it.price * it.quantity
          ).toFixed(2)}`
      )
      .join('\n');

  const buildResumenEnvio = () => {
    // ✅ Aunque el pedido sea digital, igual pedimos dirección.
    // Mantengo tu texto para cuando hay físicos; si no hay físicos, lo dejamos claro.
    if (!contieneFisicos) return 'Pedido digital (sin envío físico) — se registró dirección igualmente';
    return formData.metodoEntrega === 'domicilio'
      ? 'Envío a domicilio por Correo Argentino (a coordinar)'
      : 'Envío a sucursal de Correo Argentino (a coordinar)';
  };

  // ✅ Bloque “bonito” para pegar en el email con 1 variable
  const buildDireccionTexto = () => {
    const linea1 = `${formData.calle} ${formData.numero}`.trim();

    const pisoDto = [
      formData.piso ? `Piso ${formData.piso}` : null,
      formData.departamento ? `Dpto ${formData.departamento}` : null,
    ]
      .filter(Boolean)
      .join(' - ');

    const linea2 = [
      pisoDto || null,
      formData.barrio ? `Barrio ${formData.barrio}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    const linea3 = `${formData.localidad}, ${formData.provincia} (CP ${formData.cp})`;

    return [
      `Método de entrega: ${formData.metodoEntrega === 'domicilio' ? 'Domicilio' : 'Sucursal'}`,
      `Dirección: ${linea1}`,
      linea2 ? `Info: ${linea2}` : null,
      `Localidad/Provincia: ${linea3}`,
    ]
      .filter(Boolean)
      .join('\n');
  };

  const safeJson = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: 'Respuesta no válida (no es JSON)', raw: text };
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const numeroPedido = Math.floor(1000 + Math.random() * 9000);

    const resumenProductos = buildResumenProductos();
    const resumenEnvio = buildResumenEnvio();
    const direccionTexto = buildDireccionTexto();

    // Desglose para guardar / resumen
    const templateParams = {
      ...formData,
      order_id: numeroPedido,
      resumenProductos,
      resumenEnvio,

      // ✅ nuevo: bloque de dirección “listo para mail”
      direccionTexto,

      // desglose
      subtotalOriginal: subtotalOriginal.toFixed(2),
      descuentoAutomatico: descuentoAutomatico.toFixed(2),
      subtotalConAuto: cartSubtotal.toFixed(2),
      cupon: appliedCoupon || '',
      cuponPct: discount > 0 ? `${(discount * 100).toFixed(0)}%` : '0%',
      descuentoCupon: cartDiscountAmount.toFixed(2),

      // transferencia
      metodoPago: paymentMethod === 'mp' ? 'Mercado Pago' : 'Transferencia',
      transferenciaPct:
        paymentMethod === 'transfer' ? `${(transferDiscountPct * 100).toFixed(0)}%` : '0%',
      descuentoTransferencia: transferenciaDescuentoMonto.toFixed(2),

      // envío y total
      envio: envioFinal.toFixed(2),
      total: totalFinal.toFixed(2),
    };

    try {
      // Guardar para /resumen (así si vuelve de MP, ya está todo listo)
      localStorage.setItem('lastCheckoutInfo', JSON.stringify(templateParams));
      localStorage.setItem('lastCart', JSON.stringify(cartItems));

      // ✅ Si eligió TRANSFERENCIA: enviamos mail como venías haciendo y vamos a resumen
      if (paymentMethod === 'transfer') {
        await emailjs.send('service_wg78xcn', 'template_b529mq6', templateParams, 'cHz6pQf3uU5jTYI48');

        clearCart();
        router.push(`/resumen?pedido=${numeroPedido}&email=${formData.email}`);
        return;
      }

      // ✅ Si eligió MERCADO PAGO: creamos preferencia y redirigimos a Checkout Pro
      const items = cartItems.map((it) => ({
        title: `${it.name}${it.variantLabel ? ` (${it.variantLabel})` : ''}`,
        quantity: it.quantity,
        unit_price: Number(it.price), // precio unitario con descuentos por cantidad
      }));

      const res = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: numeroPedido,
          payer: {
            name: formData.nombre,
            surname: formData.apellido,
            email: formData.email,
            phone: formData.telefono,
          },
          items,
          shipping: contieneFisicos ? { cost: envioFinal, mode: formData.metodoEntrega } : null,
          meta: {
            resumenEnvio,
            cupon: appliedCoupon || null,
          },
          backTo: {
            pedido: numeroPedido,
            email: formData.email,
          },
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || !data?.init_point) {
        console.error('Error creando preferencia MP:', data);
        alert(`No se pudo iniciar Mercado Pago. ${data?.error || ''}`.trim());
        return;
      }

      // Redirige a MP
      const url = data.init_point;
      window.location.href = url;
    } catch (error) {
      console.error('Error en checkout:', error);
      alert('Hubo un error al procesar tu compra. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-[#A56ABF] mb-6 text-center">
        <div className="flex items-center justify-center mb-6 text-sm sm:text-base font-medium text-gray-600">
          <button
            type="button"
            onClick={openCart}
            className="flex items-center space-x-1 text-[#A56ABF] hover:underline"
          >
            <span>🛒 Carrito</span>
          </button>
          <span className="mx-2">→</span>
          <span className="text-[#A084CA]">📝 Información</span>
          <span className="mx-2">→</span>
          <span className="text-gray-400">✅ Compra finalizada</span>
        </div>
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow">
        {/* CONTACTO */}
        <h3 className="text-md font-semibold text-[#A56ABF] mb-2">Datos de contacto:</h3>
        <input
          type="text"
          name="nombre"
          required
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Nombre"
          className="w-full border p-2 rounded-md"
        />
        <input
          type="text"
          name="apellido"
          required
          value={formData.apellido}
          onChange={handleChange}
          placeholder="Apellido"
          className="w-full border p-2 rounded-md"
        />
        <input
          type="email"
          name="email"
          required
          value={formData.email}
          onChange={handleChange}
          placeholder="Correo electrónico"
          className="w-full border p-2 rounded-md"
        />
        <input
          type="tel"
          name="telefono"
          required
          value={formData.telefono}
          onChange={handleChange}
          placeholder="Teléfono"
          className="w-full border p-2 rounded-md"
        />

        {/* PERSONALIZACIÓN (NO SE TOCA) */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-md font-semibold text-[#A56ABF] mb-2">
            Datos para la personalización del producto:
          </h3>
          <input
            type="text"
            name="evento"
            required
            value={formData.evento}
            onChange={handleChange}
            placeholder="Temática deseada (Ejemplo: Baby Shark, Unicornio...)"
            className="w-full border p-2 rounded-md mb-2"
          />
          <input
            type="text"
            name="nombrePersonalizado"
            required
            value={formData.nombrePersonalizado}
            onChange={handleChange}
            placeholder="Nombre del niño/a"
            className="w-full border p-2 rounded-md mb-2"
          />
          <input
            type="number"
            name="edad"
            required
            value={formData.edad}
            onChange={handleChange}
            placeholder="Edad"
            className="w-full border p-2 rounded-md mb-2"
          />
          <input
            type="text"
            name="fechaHora"
            required
            value={formData.fechaHora}
            onChange={handleChange}
            placeholder="Fecha del evento"
            className="w-full border p-2 rounded-md mb-2"
          />
          <input
            type="text"
            name="direccioninvitacion"
            value={formData.direccioninvitacion}
            onChange={handleChange}
            placeholder="Dirección para la invitación (opcional)"
            className="w-full border p-2 rounded-md mb-2"
          />
        </div>

        {/* ✅ DIRECCIÓN / ENTREGA (AHORA SIEMPRE, NO IMPORTA SI ES DIGITAL O FÍSICO) */}
        <div className="border-t pt-4 mt-4 space-y-2">
          <h3 className="text-md font-semibold text-[#A56ABF] mb-2">Dirección / Entrega:</h3>

          <select
            name="metodoEntrega"
            value={formData.metodoEntrega}
            onChange={handleChange}
            className="w-full border p-2 rounded-md"
          >
            <option value="sucursal">Retiro en sucursal (Correo Argentino)</option>
            <option value="domicilio">Envío a domicilio</option>
          </select>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              name="provincia"
              required
              value={formData.provincia}
              onChange={handleChange}
              placeholder="Provincia"
              className="w-full border p-2 rounded-md"
            />
            <input
              type="text"
              name="localidad"
              required
              value={formData.localidad}
              onChange={handleChange}
              placeholder="Localidad / Ciudad"
              className="w-full border p-2 rounded-md"
            />
          </div>

          <input
            type="text"
            name="cp"
            required
            value={formData.cp}
            onChange={handleChange}
            placeholder="Código Postal"
            className="w-full border p-2 rounded-md"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              name="calle"
              required
              value={formData.calle}
              onChange={handleChange}
              placeholder="Calle"
              className="w-full border p-2 rounded-md"
            />
            <input
              type="text"
              name="numero"
              required
              value={formData.numero}
              onChange={handleChange}
              placeholder="Número"
              className="w-full border p-2 rounded-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              name="piso"
              value={formData.piso}
              onChange={handleChange}
              placeholder="Piso (opcional)"
              className="w-full border p-2 rounded-md"
            />
            <input
              type="text"
              name="departamento"
              value={formData.departamento}
              onChange={handleChange}
              placeholder="Depto (opcional)"
              className="w-full border p-2 rounded-md"
            />
          </div>

          <input
            type="text"
            name="barrio"
            value={formData.barrio}
            onChange={handleChange}
            placeholder="Barrio (opcional)"
            className="w-full border p-2 rounded-md"
          />

          <p className="text-xs text-gray-600">
            *Pedimos estos datos para coordinar la entrega y tener tu pedido completo.
          </p>
        </div>

        <textarea
          name="mensaje"
          rows={3}
          value={formData.mensaje}
          onChange={handleChange}
          placeholder="Ej: Paleta de colores (opcional)"
          className="w-full border p-2 rounded-md mt-4"
        />

        {/* MÉTODO DE PAGO */}
        <div className="border-t pt-4 mt-4 space-y-3">
          <h3 className="text-md font-semibold text-[#A56ABF] mb-1">Método de pago:</h3>

          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="paymentMethod"
              value="mp"
              checked={paymentMethod === 'mp'}
              onChange={() => setPaymentMethod('mp')}
              className="mt-1"
            />
            <div>
              <p className="font-medium text-gray-800">Mercado Pago</p>
              <p className="text-sm text-gray-600">Tarjeta de crédito o débito.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="paymentMethod"
              value="transfer"
              checked={paymentMethod === 'transfer'}
              onChange={() => setPaymentMethod('transfer')}
              className="mt-1"
            />
            <div>
              <p className="font-medium text-gray-800">Transferencia Bancaria 10% OFF</p>
              <p className="text-sm text-gray-600">
                Se aplica <strong>10% OFF</strong> sin considerar envío. Verás los datos de pago al confirmar la compra.
              </p>
            </div>
          </label>
        </div>

        <p className="text-sm text-gray-600">
          (*) Campos obligatorios. Una vez finalizada la compra podrás visualizar el alias para realizar el pago (si
          elegiste transferencia).
        </p>

        {/* Resumen visible */}
        <div className="bg-gray-50 p-4 rounded-lg text-right border mt-4 text-sm space-y-1">
          <p>
            Subtotal original: <span className="font-medium">${subtotalOriginal.toFixed(2)}</span>
          </p>

          {descuentoAutomatico > 0 && (
            <p className="text-[#A084CA]">
              Descuento automático: <span className="font-medium">-${descuentoAutomatico.toFixed(2)}</span>
            </p>
          )}

          <p>
            Subtotal: <span className="font-medium">${cartSubtotal.toFixed(2)}</span>
          </p>

          {discount > 0 && (
            <p className="text-green-600">
              Cupón ({(discount * 100).toFixed(0)}%):{' '}
              <span className="font-medium">-${cartDiscountAmount.toFixed(2)}</span>
            </p>
          )}

          {paymentMethod === 'transfer' && (
            <p className="text-green-700">
              Transferencia (10% OFF): <span className="font-medium">-${transferenciaDescuentoMonto.toFixed(2)}</span>
            </p>
          )}

          <p>
            Envío:{' '}
            <span className="font-medium">
              {envioPrecio !== null ? `$${envioPrecio.toFixed(2)}` : 'a coordinar'}
            </span>
          </p>

          <p className="text-lg font-bold mt-2">Total: ${totalFinal.toFixed(2)}</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#A084CA] text-white py-2 rounded-full hover:bg-[#8C6ABF] transition"
        >
          {loading ? 'Procesando...' : paymentMethod === 'mp' ? 'Pagar con Mercado Pago' : 'Finalizar compra'}
        </button>
      </form>
    </div>
  );
}
