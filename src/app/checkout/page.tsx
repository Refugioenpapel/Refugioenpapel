// app/checkout/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import emailjs from 'emailjs-com';
import { useCart } from '@context/CartContext';
import type { CorreoSucursalOption } from '@lib/correoArgentino/branchLookup';
import { applyProductDiscount, extractCorreoRateAmount } from '@lib/pricing';

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

  const descuentoPromocionProductos = useMemo(
    () =>
      Math.max(
        0,
        cartItems.reduce((acc, it) => {
          const promoUnit = applyProductDiscount(it.originalPrice, it.product_discount_pct);
          return acc + (it.originalPrice - promoUnit) * it.quantity;
        }, 0)
      ),
    [cartItems]
  );

  const descuentoPorCantidad = useMemo(
    () =>
      Math.max(
        0,
        cartItems.reduce((acc, it) => {
          const promoUnit = applyProductDiscount(it.originalPrice, it.product_discount_pct);
          return acc + (promoUnit * it.quantity - priceLine(it));
        }, 0)
      ),
    [cartItems, priceLine]
  );

  const descuentoAutomatico = useMemo(
    () =>
      Math.max(
        0,
        descuentoPromocionProductos + descuentoPorCantidad
      ),
    [descuentoPromocionProductos, descuentoPorCantidad]
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
  const [shippingRates, setShippingRates] = useState<{
    domicilio: number | null;
    sucursal: number | null;
  }>({ domicilio: null, sucursal: null });
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [branchOptions, setBranchOptions] = useState<CorreoSucursalOption[]>([]);
  const [branchFallback, setBranchFallback] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [provincias, setProvincias] = useState<{ id: string; nombre: string }[]>([]);
  const [localidadSuggestions, setLocalidadSuggestions] = useState<string[]>([]);
  const [showLocalidadSuggestions, setShowLocalidadSuggestions] = useState(false);
  const localidadSuggestionsCache = useRef<Record<string, string[]>>({});

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
  const visibleLocalidadSuggestions =
    localidadSuggestions.length > 0
      ? localidadSuggestions
      : showLocalidadFallback
      ? localidadesSugeridas
      : [];

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

  const envioPrecio =
    formData.metodoEntrega === 'domicilio'
      ? shippingRates.domicilio
      : shippingRates.sucursal;

  const envioFinal = envioPrecio || 0;

  const selectedBranch = useMemo(
    () => branchOptions.find((branch) => branch.id === selectedBranchId) || null,
    [branchOptions, selectedBranchId]
  );

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
      setSelectedBranchId('');
      setFormData((prev) => ({
        ...prev,
        provincia: value,
        provinciaId: selected?.id ?? '',
        localidad: '',
      }));
      return;
    }

    if (name === 'metodoEntrega') {
      if (value === 'domicilio') setSelectedBranchId('');
      setFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }

    if (name === 'localidad' || name === 'cp') {
      setSelectedBranchId('');
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
      setShippingRates({ domicilio: null, sucursal: null });
      setShippingError(null);
      return;
    }

    const postalCode = formData.cp.trim();
    if (!postalCode || postalCode.length < 4) {
      setShippingRates({ domicilio: null, sucursal: null });
      setShippingError(null);
      return;
    }

    let ignore = false;
    const fetchBranches = async () => {
      try {
        const res = await fetch('/api/correo/agencies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cp: postalCode,
            provincia: formData.provincia,
            localidad: formData.localidad,
          }),
        });
        const data = await res.json();
        if (!ignore) {
          if (Array.isArray(data.agencies)) {
            setBranchOptions(data.agencies);
            setBranchFallback(data.fallback !== false);
          } else {
            setBranchOptions([]);
            setBranchFallback(true);
          }
        }
      } catch (error) {
        if (!ignore) {
          setBranchOptions([]);
          setBranchFallback(true);
        }
      }
    };

    fetchBranches();

    const cotizarEnvio = async () => {
      setShippingLoading(true);
      setShippingError(null);
      setShippingRates({ domicilio: null, sucursal: null });

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
            destinationPostalCode: postalCode,
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

    cotizarEnvio();

    return () => {
      ignore = true;
    };
  }, [contieneFisicos, formData.cp, formData.provincia, formData.localidad, shippingDimensions]);

  useEffect(() => {
    if (!formData.provinciaId) {
      setLocalidadSuggestions([]);
      return;
    }

    const rawQuery = formData.localidad.trim();
    const query = normalizeSearchText(rawQuery);

    if (!showLocalidadSuggestions || query.length < 2) {
      setLocalidadSuggestions([]);
      return;
    }

    const cacheKey = `${formData.provinciaId}:${query}`;
    const cachedSuggestions = localidadSuggestionsCache.current[cacheKey];
    if (cachedSuggestions) {
      setLocalidadSuggestions(cachedSuggestions);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const endpoint = `https://apis.datos.gob.ar/georef/api/localidades?provincia=${formData.provinciaId}&nombre=${encodeURIComponent(query)}&campos=nombre&orden=nombre&max=20`;

        const res = await fetch(endpoint, { signal: controller.signal });
        const data = await res.json();
        if (Array.isArray(data.localidades)) {
          const suggestions: string[] = Array.from(
            new Set<string>(
              data.localidades
                .map((loc: any) => String(loc?.nombre || '').trim())
                .filter(Boolean)
            )
          ).slice(0, 12);

          localidadSuggestionsCache.current[cacheKey] = suggestions;
          setLocalidadSuggestions(suggestions);
        }
      } catch (error) {
        if ((error as any).name !== 'AbortError') {
          console.error('Error cargando localidades:', error);
        }
      }
    }, 120);

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
    if (formData.metodoEntrega === 'domicilio') {
      return 'Envío a domicilio por Correo Argentino';
    }

    return selectedBranch
      ? `Retiro en sucursal Correo Argentino: ${selectedBranch.title} (${selectedBranch.address} - ${selectedBranch.locality}, ${selectedBranch.province})`
      : 'Retiro en sucursal de Correo Argentino (pendiente de selección)';
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
      selectedBranch
        ? `Sucursal elegida: ${selectedBranch.title} (${selectedBranch.id}) - ${selectedBranch.address}, ${selectedBranch.locality}, ${selectedBranch.province}${selectedBranch.postalCode ? ` CP ${selectedBranch.postalCode}` : ''}`
        : null,
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

    if (contieneFisicos && formData.metodoEntrega === 'sucursal' && !selectedBranch) {
      alert('Elegí una sucursal de Correo Argentino para retirar tu pedido.');
      setLoading(false);
      return;
    }

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
      descuentoPromocionProductos: descuentoPromocionProductos.toFixed(2),
      descuentoPorCantidad: descuentoPorCantidad.toFixed(2),
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
      selectedBranch: selectedBranch || null,
      selectedBranchId: selectedBranch?.id || '',
      selectedBranchTitle: selectedBranch?.title || '',
      selectedBranchAddress: selectedBranch?.address || '',
      selectedBranchLocality: selectedBranch?.locality || '',
      selectedBranchProvince: selectedBranch?.province || '',
      selectedBranchPostalCode: selectedBranch?.postalCode || '',
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

          {contieneFisicos && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`relative flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${
                  formData.metodoEntrega === 'domicilio'
                    ? 'border-[#A084CA] bg-[#F7F2FA] shadow-sm'
                    : 'border-[#E5D2ED] bg-white hover:bg-[#FAF8FF]'
                }`}
              >
                <input
                  type="radio"
                  name="metodoEntrega"
                  value="domicilio"
                  checked={formData.metodoEntrega === 'domicilio'}
                  onChange={handleChange}
                  className="mt-1 accent-[#A084CA]"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-800">Envío a domicilio</p>
                    <p className="font-bold text-[#A084CA]">
                      {shippingRates.domicilio !== null
                        ? `$${shippingRates.domicilio.toFixed(2)}`
                        : 'a coordinar'}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">
                    Recibí tu pedido en la dirección que cargues abajo.
                  </p>
                </div>
              </label>

              <label
                className={`relative flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${
                  formData.metodoEntrega === 'sucursal'
                    ? 'border-[#A084CA] bg-[#F7F2FA] shadow-sm'
                    : 'border-[#E5D2ED] bg-white hover:bg-[#FAF8FF]'
                }`}
              >
                <input
                  type="radio"
                  name="metodoEntrega"
                  value="sucursal"
                  checked={formData.metodoEntrega === 'sucursal'}
                  onChange={handleChange}
                  className="mt-1 accent-[#A084CA]"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-800">Retiro en sucursal</p>
                    <p className="font-bold text-[#A084CA]">
                      {shippingRates.sucursal !== null
                        ? `$${shippingRates.sucursal.toFixed(2)}`
                        : 'a coordinar'}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">
                    Elegí una sucursal de Correo Argentino cercana a tu localidad.
                  </p>
                </div>
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                className="w-full border p-2 rounded-md"
                autoComplete="off"
              />
              {showLocalidadSuggestions && visibleLocalidadSuggestions.length > 0 && (
                <ul className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-[#E5D2ED] bg-white py-1 text-sm shadow-xl">
                  {visibleLocalidadSuggestions.map((localidad) => (
                    <li key={localidad}>
                      <button
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setSelectedBranchId('');
                          setFormData((prev) => ({ ...prev, localidad }));
                          setShowLocalidadSuggestions(false);
                        }}
                        className="w-full px-3 py-2 text-left text-gray-700 transition hover:bg-[#F7F2FA] hover:text-[#A084CA]"
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
            <div className="mt-4 rounded-3xl border border-[#E5D2ED] bg-white p-4 text-sm text-gray-700">
              <h4 className="font-semibold text-[#A084CA] mb-3">Cotización de Correo Argentino</h4>
              {shippingLoading ? (
                <p className="text-gray-600">Cotizando envío...</p>
              ) : shippingError ? (
                <p className="text-red-600">{shippingError}</p>
              ) : formData.cp.trim().length >= 4 ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-[#E5D2ED] bg-[#F7F2FA] p-3">
                    <div className="flex justify-between gap-3">
                      <span>
                        {formData.metodoEntrega === 'domicilio'
                          ? 'Envío a domicilio seleccionado'
                          : 'Retiro en sucursal seleccionado'}
                      </span>
                      <span className="font-semibold text-[#A084CA]">
                        {envioPrecio !== null ? `$${envioPrecio.toFixed(2)}` : 'a coordinar'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">
                      {formData.metodoEntrega === 'domicilio'
                        ? 'El envío se despacha a la dirección ingresada.'
                        : 'Seleccioná abajo la sucursal donde querés retirar.'}
                    </p>
                  </div>

                  {formData.metodoEntrega === 'sucursal' && branchOptions.length > 0 ? (
                    <div>
                      <p className="font-medium text-sm text-[#A084CA] mb-2">
                        Elegí una sucursal de retiro
                      </p>
                      <div className="space-y-2">
                        {branchOptions.map((branch) => (
                          <label
                            key={branch.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition ${
                              selectedBranchId === branch.id
                                ? 'border-[#A084CA] bg-[#F7F2FA]'
                                : 'border-[#E5D2ED] bg-[#FAF8FF] hover:bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="selectedBranch"
                              value={branch.id}
                              checked={selectedBranchId === branch.id}
                              onChange={() => setSelectedBranchId(branch.id)}
                              required={formData.metodoEntrega === 'sucursal'}
                              className="mt-1 accent-[#A084CA]"
                            />
                            <div>
                              <p className="font-medium">{branch.title}</p>
                              <p className="text-sm text-gray-600">{branch.address}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {branch.locality}, {branch.province}
                                {branch.postalCode ? ` · CP ${branch.postalCode}` : ''}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : formData.metodoEntrega === 'sucursal' ? (
                    <p className="text-sm text-gray-600">
                      {branchFallback
                        ? 'No encontramos sucursales confiables para la provincia/localidad/CP ingresados. Revisá los datos o elegí envío a domicilio.'
                        : 'Las sucursales se ofrecen según la provincia, localidad y código postal ingresados.'}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Si preferís retirar, cambiá a “Retiro en sucursal” y elegí una opción disponible.
                    </p>
                  )}
                </div>
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
            <>
              {descuentoPromocionProductos > 0 && (
                <p className="text-pink-600">
                  Promoción productos: <span className="font-medium">-${descuentoPromocionProductos.toFixed(2)}</span>
                </p>
              )}
              {descuentoPorCantidad > 0 && (
                <p className="text-[#A084CA]">
                  Descuento por cantidad: <span className="font-medium">-${descuentoPorCantidad.toFixed(2)}</span>
                </p>
              )}
            </>
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
