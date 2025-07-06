'use client';

import { useState } from 'react';
import { useCart } from '@context/CartContext';
import ProductImageCarousel from '@components/ProductImageCarousel';
import type { Product } from 'types/product';
import { descriptionsByCategory } from '@data/sharedDescriptions';

export default function ProductDetailClient({ product }: { product: Product }) {
  const defaultVariant =
    product.variants && product.variants.length > 0
      ? product.variants[0]
      : { label: 'Único', price: product.price ?? 0 };

  const [selectedVariant, setSelectedVariant] = useState(defaultVariant);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, openCart } = useCart();
  const longDescriptionHTML = descriptionsByCategory[product.category] || '';

  const [showZoom, setShowZoom] = useState(false);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);

  const handleAddToCart = () => {
    addToCart({
      id: `${product.id}-${selectedVariant.label}`,
      name: product.name,
      variantLabel: selectedVariant.label,
      originalPrice: selectedVariant.price,
      price: selectedVariant.price, // Se ajustará luego en el carrito si corresponde descuento
      quantity,
      image: product.images[0],
      is_physical: product.is_physical,
      bulk_discounts: product.bulk_discounts,
    });
    openCart();
  };

  const handlePrev = () => {
    if (zoomIndex !== null) {
      setZoomIndex((prev) =>
        prev === 0 ? product.images.length - 1 : (prev as number) - 1
      );
    }
  };

  const handleNext = () => {
    if (zoomIndex !== null) {
      setZoomIndex((prev) =>
        prev === product.images.length - 1 ? 0 : (prev as number) + 1
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
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

        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#A084CA] mb-2">{product.name}</h1>
          <p className="text-gray-700 mb-4">{product.description}</p>

          <p className="text-lg font-bold text-gray-800 mb-4">
          ${selectedVariant.price.toFixed(2)}
          </p>

          {product.variants && product.variants.length > 0 && (
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-sm">Selecciona una opción:</label>
              <select
                value={selectedVariant.label}
                onChange={(e) => {
                  const variant = product.variants?.find((v) => v.label === e.target.value);
                  if (variant) setSelectedVariant(variant);
                }}
                className="w-full border rounded-lg p-2 text-sm"
              >
                {product.variants.map((variant) => (
                  <option key={variant.label} value={variant.label}>
                    {variant.label}
                  </option>
                ))}
              </select>
            </div>
          )}

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

          <button
            onClick={handleAddToCart}
            className="px-6 py-2 bg-[#A084CA] text-white rounded-full hover:bg-[#8C6ABF] transition"
          >
            Agregar al carrito
          </button>
          {/* Mensaje visible solo para productos de categoría "souvenirs" */}
          {product.category === 'souvenirs' && (
            <p className="mt-4 text-sm text-gray-600 italic">
              ⏳ Tiempo estimado de producción: <strong>15 días hábiles.</strong>
            </p>
          )}
        </div>
      </div>

      {longDescriptionHTML && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2 text-[#A084CA]">Descripción del Producto:</h2>
          <div
            className="prose prose-sm text-gray-700"
            dangerouslySetInnerHTML={{ __html: longDescriptionHTML }}
          />
        </div>
      )}

      {showZoom && zoomIndex !== null && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4"
          onClick={() => setShowZoom(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowZoom(false);
            }
          }}
          tabIndex={-1}
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
              className="max-w-[105vw] max-h-[105vh] rounded shadow-lg"
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
