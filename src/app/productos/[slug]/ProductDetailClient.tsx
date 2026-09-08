// app/productos/[slug]/ProductDetailClient.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCart } from '@context/CartContext';
import ProductImageCarousel from '@components/ProductImageCarousel';
import type { Product } from 'types/product';
import {
  GENERIC_PHYSICAL_DESCRIPTION,
  GENERIC_DIGITAL_DESCRIPTION,
} from '@data/sharedDescriptions';
import PriceBlock from '@components/ui/PriceBlock';
import type { CorreoSucursalOption } from '@lib/correoArgentino/branchLookup';
import { applyProductDiscount, extractCorreoRateAmount, sanitizeDiscountPct } from '@lib/pricing';

type Variant = { label: string; price: number };

// Helper para obtener una variante por defecto siempre válida
function getDefaultVariant(product: Product): Variant {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants[0];
  }
  return {
    label: 'Único',
    price: product.price ?? 0,
  };
}

export default function ProductDetailClient({ product }: { product: Product }) {
  const [selectedVariant, setSelectedVariant] = useState<Variant>(
    getDefaultVariant(product)
  );
  const [quantity, setQuantity] = useState(1);
  const [cp, setCp] = useState('');
  const [shippingRates, setShippingRates] = useState<{
    domicilio: number | null;
    sucursal: number | null;
  }>({ domicilio: null, sucursal: null });
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [branchOptions, setBranchOptions] = useState<CorreoSucursalOption[]>([]);
  const [branchFallback, setBranchFallback] = useState(false);

  const { addToCart, openCart } = useCart();

  const longDescriptionHTML = product.is_physical
    ? GENERIC_PHYSICAL_DESCRIPTION
    : GENERIC_DIGITAL_DESCRIPTION;

  const [showZoom, setShowZoom] = useState(false);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);

  // Cuando cambia el producto, reseteamos variante + cantidad
  useEffect(() => {
    setSelectedVariant(getDefaultVariant(product));
    setQuantity(1);
  }, [product.id, product.slug]);

  const firstImage = useMemo(
    () => (product.images?.length ? product.images[0] : '/placeholder.png'),
    [product.images]
  );

  const hasBulkNew = Boolean(
    product.is_physical &&
      product.bulk_threshold_qty &&
      product.bulk_discount_pct
  );

  const bulkHint = useMemo(() => {
    if (!hasBulkNew) return '';
    return `Llevando ${product.bulk_threshold_qty} unidades o más ${product.bulk_discount_pct}%OFF.`;
  }, [hasBulkNew, product.bulk_threshold_qty, product.bulk_discount_pct]);

  const shippingDimensions = useMemo(
    () => ({
      weight: Math.max(1, Number((product as any).weight) || 1000),
      height: 10,
      width: 20,
      length: 30,
    }),
    [product]
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
    const postalCode = cp.trim();
    if (postalCode.length < 4) {
      setBranchOptions([]);
      setBranchFallback(false);
      return;
    }

    let ignore = false;
    const fetchBranches = async () => {
      try {
        const res = await fetch('/api/correo/agencies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cp: postalCode }),
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
    return () => {
      ignore = true;
    };
  }, [cp]);

  useEffect(() => {
    if (!product.is_physical) {
      setShippingRates({ domicilio: null, sucursal: null });
      setShippingError(null);
      return;
    }

    const postalCode = cp.trim();
    if (!postalCode || postalCode.length < 4) {
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
              'No se pudo obtener la cotización. Verificá el código postal e intentá nuevamente.'
            );
          }
        }
      } catch (error) {
        if (!ignore) {
          setShippingRates({ domicilio: null, sucursal: null });
          setShippingError(
            error instanceof Error
              ? error.message
              : 'No se pudo calcular el envío'
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
  }, [cp, product.is_physical, shippingDimensions]);

  const handleAddToCart = () => {
    const unitPrice = Number(selectedVariant.price || 0);
    const productDiscountPct = sanitizeDiscountPct(product.discount);
    const promoPrice = applyProductDiscount(unitPrice, productDiscountPct);

    addToCart({
      id: `${product.id}-${selectedVariant.label}`,
      name: product.name,
      variantLabel: selectedVariant.label,
      originalPrice: unitPrice,
      price: promoPrice,
      product_discount_pct: productDiscountPct > 0 ? productDiscountPct : null,
      promoPrice,
      quantity,
      image: firstImage,
      weight: Number((product as any).weight) || 1000,
      is_physical: product.is_physical,
      bulk_threshold_qty: product.bulk_threshold_qty ?? null,
      bulk_discount_pct: product.bulk_discount_pct ?? null,
      bulk_discounts: product.bulk_discounts ?? undefined,
    });

    openCart();
  };

  const handlePrev = () => {
    setZoomIndex((prev) => {
      if (prev === null || !product.images?.length) return prev;
      return prev === 0 ? product.images.length - 1 : prev - 1;
    });
  };

  const handleNext = () => {
    setZoomIndex((prev) => {
      if (prev === null || !product.images?.length) return prev;
      return prev === product.images.length - 1 ? 0 : prev + 1;
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* IMÁGENES + INFO */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full max-w-sm mx-auto">
          <ProductImageCarousel
            images={product.images}
            alt={product.name}
            onImageClick={(_, index) => {
              setZoomIndex(index);
              setShowZoom(true);
            }}
          />
        </div>

        {/* TEXTO */}
        <div className="flex-1">
          {/* TÍTULO ROSADITO 💗 */}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#cc4a72] mb-2">
            {product.name}
          </h1>

          <p className="text-gray-700 mb-4">{product.description}</p>

          {/* PRECIO (según variante seleccionada) */}
          <PriceBlock
            className="mb-2"
            price={Number(selectedVariant.price || 0)}
            discountPct={product.discount ?? 0}
            priceClassName="text-lg font-bold text-gray-800"
            compareClassName="text-gray-400 line-through text-sm"
            transferClassName="text-sm text-gray-600"
          />

          {sanitizeDiscountPct(product.discount) > 0 && (
            <p className="mb-3 inline-flex rounded-full bg-pink-100 px-3 py-1 text-sm font-semibold text-pink-700">
              {sanitizeDiscountPct(product.discount)}% OFF
            </p>
          )}

          {/* Hint de descuento por cantidad */}
          {hasBulkNew && (
            <p className="text-sm text-[#7D5BBE] bg-[#EFE7FF] inline-block px-2 py-1 rounded mb-3">
              {bulkHint}
            </p>
          )}

          {/* SELECT DE VARIANTES */}
          {Array.isArray(product.variants) && product.variants.length > 0 && (
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-sm">
                Selecciona una opción:
              </label>
              <select
                value={selectedVariant.label}
                onChange={(e) => {
                  const v = product.variants?.find(
                    (v) => v.label === e.target.value
                  );
                  if (v) setSelectedVariant(v);
                }}
                className="w-full border rounded-lg p-2 text-sm"
              >
                {product.variants?.map((variant) => (
                  <option key={variant.label} value={variant.label}>
                    {variant.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* CANTIDAD */}
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-semibold">Cantidad:</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                −
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                +
              </button>
            </div>
          </div>

          {/* BOTÓN AGREGAR */}
          <button
            onClick={handleAddToCart}
            className="px-6 py-2 bg-[#A084CA] text-white rounded-full hover:bg-[#8C6ABF] transition"
          >
            Agregar al carrito
          </button>

          {product.is_physical ? (
            <div className="mt-6 rounded-3xl border border-[#E5D2ED] bg-[#FEF7FF] p-4 text-sm text-gray-700">
              <h2 className="text-lg font-semibold text-[#A084CA] mb-2">
                Ver costo de envío
              </h2>
              <p className="mb-3">
                Ingresá tu código postal para ver el costo de envío a domicilio
                y la opción de retiro en sucursal.
              </p>

              <div className="space-y-3 mb-3">
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
                <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-600">
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
                <div className="grid gap-2">
                  <div className="rounded-2xl border border-[#E5D2ED] bg-white p-3 flex items-center justify-between">
                    <span>Envío a domicilio</span>
                    <span className="font-semibold text-[#A084CA]">
                      {shippingRates.domicilio !== null
                        ? `$${shippingRates.domicilio.toFixed(2)}`
                        : 'a coordinar'}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-[#E5D2ED] bg-white p-3 flex items-center justify-between">
                    <span>Retiro en sucursal</span>
                    <span className="font-semibold text-[#A084CA]">
                      {shippingRates.sucursal !== null
                        ? `$${shippingRates.sucursal.toFixed(2)}`
                        : 'a coordinar'}
                    </span>
                  </div>
                </div>
              )}

              {cp.trim().length >= 4 && (
                branchOptions.length > 0 ? (
                  <div className="mt-4">
                    <h3 className="font-semibold text-sm text-[#A084CA] mb-2">
                      Sucursales sugeridas para este CP
                    </h3>
                    <ul className="space-y-2">
                      {branchOptions.map((branch) => (
                        <li
                          key={branch.id}
                          className="rounded-2xl border border-[#E5D2ED] bg-white p-3"
                        >
                          <p className="font-medium">{branch.title}</p>
                          <p className="text-sm text-gray-600">{branch.address}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {branch.locality}, {branch.province}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : branchFallback ? (
                  <p className="mt-4 rounded-2xl border border-[#E5D2ED] bg-white p-3 text-sm text-gray-600">
                    No encontramos una sucursal de retiro confiable solo con este CP. En el checkout, completando provincia y localidad, podremos sugerir mejor la sucursal o coordinarla antes del despacho.
                  </p>
                ) : null
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-[#E5D2ED] bg-[#F9FAFB] p-4 text-sm text-gray-700">
              Este producto no requiere envío físico.
            </div>
          )}

 {/* Elimina Tiempo en Souvenirs
          {product.category === 'souvenirs' && (
            <p className="mt-4 text-sm text-gray-600 italic">
              ⏳ Tiempo estimado de producción:{' '}
              <strong>15 días hábiles.</strong>
            </p>
          )}
            */}
        </div>
      </div>

      {/* DESCRIPCIÓN LARGA GENERAL (RULUKO) */}
      <div
        className="prose-ruluko mt-10 text-[#444444]"
        dangerouslySetInnerHTML={{ __html: longDescriptionHTML }}
      />

      {/* ZOOM IMÁGENES */}
      {showZoom && zoomIndex !== null && product.images?.length > 0 && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4"
          onClick={() => setShowZoom(false)}
        >
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowZoom(false)}
              className="absolute top-4 right-4 text-white text-3xl font-bold"
            >
              &times;
            </button>

            <button
              onClick={handlePrev}
              className="absolute left-[-60px] top-1/2 -translate-y-1/2 text-white text-4xl font-bold px-2"
            >
              ‹
            </button>

            <img
              src={product.images[zoomIndex]}
              alt="Imagen ampliada"
              className="max-w-[90vw] max-h-[90vh] rounded shadow-lg"
            />

            <button
              onClick={handleNext}
              className="absolute right-[-60px] top-1/2 -translate-y-1/2 text-white text-4xl font-bold px-2"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
