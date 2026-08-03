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
    provinciaId: '',
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
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [provincias, setProvincias] = useState<{ id: string; nombre: string }[]>([]);
  const [localidadSuggestions, setLocalidadSuggestions] = useState<string[]>([]);
  const [showLocalidadSuggestions, setShowLocalidadSuggestions] = useState(false);

  const defaultProvincias = [
    'Buenos Aires',
    'Catamarca',
    'Chaco',
    'Chubut',
    'Córdoba',
    'Corrientes',
    'Entre Ríos',
    'Formosa',
    'Jujuy',
    'La Pampa',
    'La Rioja',
    'Mendoza',
    'Misiones',
    'Neuquén',
    'Río Negro',
    'Salta',
    'San Juan',
    'San Luis',
    'Santa Cruz',
    'Santa Fe',
    'Santiago del Estero',
    'Tierra del Fuego',
    'Tucumán',
    'Ciudad Autónoma de Buenos Aires',
  ];

  const localidadesSugeridas = [
    'Buenos Aires',
    'Córdoba',
    'Rosario',
    'Mendoza',
    'La Plata',
    'San Miguel de Tucumán',
    'Mar del Plata',
    'Salta',
    'San Salvador de Jujuy',
    'Neuquén',
    'Resistencia',
    'Posadas',
    'Bahía Blanca',
    'Corrientes',
    'Santa Fe',
    'San Juan',
  ];
  const provinciaOptions = provincias.length > 0 ? provincias.map((prov) => prov.nombre) : defaultProvincias;
  const showLocalidadFallback = !formData.provinciaId;

  const totalShippingWeight = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + (item.weight ?? 1000) * item.quantity,
        0
      ),
    [cartItems]
  );

  const shippingDimensions = useMemo(
    () => ({
      weight: Math.max(1, totalShippingWeight),
      height: 10,
      width: 20,
      length: 30,
    }),
    [totalShippingWeight]
  );

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

    if (name === 'provincia') {
      const selected = provincias.find((prov) => prov.nombre === value);
      setFormData((prev) => ({
        ...prev,
        provincia: value,
        provinciaId: selected?.id ?? '',
        localidad: '',
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocalidadFocus = () => {
    setShowLocalidadSuggestions(true);
  };

  const handleLocalidadBlur = () => {
    window.setTimeout(() => setShowLocalidadSuggestions(false), 150);
  };

  const normalizeSearchText = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  const safeJson = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: 'Respuesta no válida (no es JSON)', raw: text };
    }
  };

  useEffect(() => {
    fetch('https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre&max=100')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.provincias)) {
          setProvincias(data.provincias);
        }
      })
      .catch((error) => {
        console.error('Error cargando provincias:', error);
      });
  }, []);

  useEffect(() => {
    if (!contieneFisicos) {
      setEnvioPrecio(null);
      setShippingError(null);
      return;
    }

    const cp = formData.cp.trim();
    if (!cp || cp.length < 4) {
      setEnvioPrecio(null);
      setShippingError(null);
      return;
    }

    let ignore = false;

    const cotizarEnvio = async () => {
      setShippingLoading(true);
      setShippingError(null);

      try {
        const res = await fetch('/api/correo/rate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destinationPostalCode: cp,
            deliveryType: formData.metodoEntrega,
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

        const ratesArray = Array.isArray(data?.rates) ? data.rates : [];
        if (ratesArray.length === 0) {
          throw new Error(
            'No se encontró cotización para este destino con la cuenta de Correo Argentino configurada. Revisa el código postal y el customerId, o contacta a Correo para habilitar el servicio.'
          );
        }

        const firstRate = ratesArray[0];
        const rateValue =
          firstRate?.amount ??
          firstRate?.price ??
          firstRate?.total ??
          firstRate?.cost ??
          null;

        if (rateValue === null || Number.isNaN(Number(rateValue))) {
          throw new Error('La respuesta de Correo Argentino no incluyó una tarifa válida');
        }

        if (!ignore) {
          setEnvioPrecio(Number(rateValue));
        }
      } catch (error) {
        if (!ignore) {
          setEnvioPrecio(null);
          setShippingError(
            error instanceof Error ? error.message : 'No se pudo cotizar el envío'
          );
        }
      } finally {
        if (!ignore) {
          setShippingLoading(false);
        }
      }
    };

    cotizarEnvio();

    return () => {
      ignore = true;
    };
  }, [contieneFisicos, formData.cp, formData.metodoEntrega]);

  useEffect(() => {
    if (!formData.provinciaId) {
      setLocalidadSuggestions([]);
      return;
    }

    if (!showLocalidadSuggestions && formData.localidad.trim().length < 2) {
      setLocalidadSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const rawQuery = formData.localidad.trim();
        const query = normalizeSearchText(rawQuery);
        const endpoint = query
          ? `https://apis.datos.gob.ar/georef/api/localidades?provincia=${formData.provinciaId}&nombre=${encodeURIComponent(query)}&max=50`
          : `https://apis.datos.gob.ar/georef/api/localidades?provincia=${formData.provinciaId}&max=50`;

        const res = await fetch(endpoint, { signal: controller.signal });
        const data = await res.json();
        if (Array.isArray(data.localidades)) {
          setLocalidadSuggestions(data.localidades.map((loc: any) => loc.nombre));
        }
      } catch (error) {
        if ((error as any).name !== 'AbortError') {
          console.error('Error cargando localidades:', error);
        }
      }
    }, 150);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [formData.provinciaId, formData.localidad, showLocalidadSuggestions]);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const numeroPedido = Math.floor(1000 + Math.random() * 9000);

    const resumenProductos = buildResumenProductos();
    const resumenEnvio = buildResumenEnvio();
    const direccionTexto = buildDireccionTexto();

    const hasCoupon = Boolean(appliedCoupon && String(appliedCoupon).trim());
    const hasDiscountAmount = Number(cartDiscountAmount || 0) > 0;
    const bloqueDescuento = [
      hasCoupon ? `💸 Cupón aplicado: ${appliedCoupon}` : null,
      hasDiscountAmount ? `💰 Descuento aplicado: $${Number(cartDiscountAmount).toFixed(2)}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const bloqueEnvio = `📦 Costo de envío: ${
      contieneFisicos
        ? envioFinal > 0
          ? `$${envioFinal.toFixed(2)}`
          : 'a coordinar'
        : 'No aplica (pedido digital)'
    }`;

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
      costoEnvio: contieneFisicos ? (envioFinal > 0 ? `$${envioFinal.toFixed(2)}` : 'a coordinar') : 'No aplica (pedido digital)',
      costoEnvioValor: envioFinal.toFixed(2),
      detalleEnvio: contieneFisicos
        ? `Costo de envío: ${envioFinal > 0 ? `$${envioFinal.toFixed(2)}` : 'a coordinar'}`
        : 'Sin envío físico',
      descuento: hasCoupon ? `Cupón ${appliedCoupon}` : '',
      descuentoMonto: hasDiscountAmount ? `$${Number(cartDiscountAmount).toFixed(2)}` : '',
      bloqueDescuento,
      mostrarBloqueDescuento: hasCoupon || hasDiscountAmount,
      bloqueEnvio,
      shippingWeight: shippingDimensions.weight,
      shippingHeight: shippingDimensions.height,
      shippingWidth: shippingDimensions.width,
      shippingLength: shippingDimensions.length,
    };

    try {
      // Guardar para /resumen (así si vuelve de MP, ya está todo listo)
      localStorage.setItem('lastCheckoutInfo', JSON.stringify(templateParams));
      localStorage.setItem('lastCart', JSON.stringify(cartItems));
      
      const backupRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: numeroPedido,
          paymentMethod,
          checkoutInfo: templateParams,
          cartItems,
          amountTotal: totalFinal,
        }),
      });

      if (!backupRes.ok) {
        const backupData = await safeJson(backupRes);
        console.error('No se pudo guardar backup del pedido:', backupData);
        alert('No se pudo registrar el pedido. Intenta nuevamente en unos segundos.');
        return;
      }

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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de entrega
              </label>
              <select
                name="metodoEntrega"
                value={formData.metodoEntrega}
                onChange={handleChange}
                className="w-full border p-2 rounded-md"
              >
                <option value="sucursal">Retiro en sucursal (Correo Argentino)</option>
                <option value="domicilio">Envío a domicilio</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              name="provincia"
              required
              value={formData.provincia}
              onChange={handleChange}
              className="w-full border p-2 rounded-md"
            >
              <option value="" disabled>
                Seleccioná una provincia
              </option>
              {(provincias.length > 0 ? provincias.map((prov) => prov.nombre) : defaultProvincias).map(
                (provincia) => (
                  <option key={provincia} value={provincia}>
                    {provincia}
                  </option>
                )
              )}
            </select>
            <div className="relative">
              <input
                type="text"
                name="localidad"
                required
                value={formData.localidad}
                onFocus={handleLocalidadFocus}
                onBlur={handleLocalidadBlur}
                onChange={(event) => {
                  handleChange(event);
                  setShowLocalidadSuggestions(true);
                }}
                placeholder="Localidad / Ciudad"
                list="localidades-list"
                className="w-full border p-2 rounded-md"
                autoComplete="off"
              />
              <datalist id="localidades-list">
                {localidadSuggestions.length > 0
                  ? localidadSuggestions.map((localidad) => (
                      <option key={localidad} value={localidad} />
                    ))
                  : showLocalidadFallback
                  ? localidadesSugeridas.map((localidad) => (
                      <option key={localidad} value={localidad} />
                    ))
                  : null}
              </datalist>
              {showLocalidadSuggestions && localidadSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-b-md shadow-lg">
                  {localidadSuggestions.map((localidad) => (
                    <li key={localidad}>
                      <button
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setFormData((prev) => ({ ...prev, localidad }));
                          setShowLocalidadSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100"
                      >
                        {localidad}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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

          {contieneFisicos && (
            <div className="text-sm mt-1">
              {shippingLoading ? (
                <p className="text-gray-600">Cotizando envío...</p>
              ) : shippingError ? (
                <p className="text-red-600">{shippingError}</p>
              ) : envioPrecio !== null ? (
                <p className="text-green-700">Costo estimado de envío: ${envioPrecio.toFixed(2)}</p>
              ) : (
                <p className="text-gray-600">
                  Ingresá el código postal para ver la cotización de Correo Argentino.
                </p>
              )}
            </div>
          )}

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
            {formData.provincia && !showLocalidadFallback && localidadSuggestions.length === 0
              ? ' No se encontraron localidades para la provincia seleccionada. Verificá el nombre o probá con otra localidad.'
              : ''}
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
              <p className="font-medium text-gray-800">Transferencia Bancaria</p>
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
