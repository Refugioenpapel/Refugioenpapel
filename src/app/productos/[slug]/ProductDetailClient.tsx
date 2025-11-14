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

  const handleAddToCart = () => {
    const unitPrice = Number(selectedVariant.price || 0);

    addToCart({
      id: `${product.id}-${selectedVariant.label}`,
      name: product.name,
      variantLabel: selectedVariant.label,
      originalPrice: unitPrice,
      price: unitPrice,
      quantity,
      image: firstImage,
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
          <p className="text-lg font-bold text-gray-800 mb-2">
            ${Number(selectedVariant.price || 0).toFixed(2)}
          </p>

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
