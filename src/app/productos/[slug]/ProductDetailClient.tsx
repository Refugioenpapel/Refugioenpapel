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

  const { addToCart, openCart } = useCart();
  const longDescriptionHTML = descriptionsByCategory[product.category] || '';

  const [showZoom, setShowZoom] = useState(false);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);

  const handleAddToCart = () => {
    const originalPrice = selectedVariant.price;
    const discountedPrice = Math.round(originalPrice * 0.8);

    addToCart({
      id: `${product.id}-${selectedVariant.label}`,
      name: product.name,
      variantLabel: selectedVariant.label,
      originalPrice,
      price: discountedPrice,
      quantity: 1,
      image: product.images[0],
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
        {/* Carrusel de imágenes con zoom */}
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

        {/* Detalles del producto */}
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#A084CA] mb-2">{product.name}</h1>
          <p className="text-gray-700 mb-4">{product.description}</p>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-gray-400 line-through text-base">
              ${selectedVariant.price.toFixed(2)}
            </span>
            <span className="text-lg font-bold text-gray-600">
              ${(selectedVariant.price * 0.8).toFixed(2)}
            </span>
          </div>

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

          <button
            onClick={handleAddToCart}
            className="px-6 py-2 bg-[#A084CA] text-white rounded-full hover:bg-[#8C6ABF] transition"
          >
            Agregar al carrito
          </button>
        </div>
      </div>

      {/* Descripción larga */}
      {longDescriptionHTML && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2 text-[#A084CA]">Descripción del Producto:</h2>
          <div
            className="prose prose-sm text-gray-700"
            dangerouslySetInnerHTML={{ __html: longDescriptionHTML }}
          />
        </div>
      )}

      {/* Modal para zoom con navegación */}
      {showZoom && zoomIndex !== null && (
  <div
    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4"
    onClick={() => setShowZoom(false)} // click fuera
    onKeyDown={(e) => {
      if (e.key === 'Escape') {
        setShowZoom(false);
      }
    }}
    tabIndex={-1} // necesario para capturar teclado
  >
    <div
      className="relative"
      onClick={(e) => e.stopPropagation()} // evita cierre al click sobre la imagen o botones
    >
      {/* Botón cerrar */}
      <button
        onClick={() => setShowZoom(false)}
        className="absolute top-4 right-4 text-white text-3xl font-bold"
      >
        &times;
      </button>

      {/* Botón anterior */}
      <button
        onClick={handlePrev}
        className="absolute left-[-60px] top-1/2 -translate-y-1/2 text-white text-4xl font-bold px-2"
      >
        ‹
      </button>

      {/* Imagen ampliada */}
      <img
        src={product.images[zoomIndex]}
        alt="Imagen ampliada"
        className="max-w-[105vw] max-h-[105vh] rounded shadow-lg"
      />

      {/* Botón siguiente */}
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
