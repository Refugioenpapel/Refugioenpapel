'use client';

import { useState } from 'react';
import { useCart } from '@context/CartContext';
import ProductImageCarousel from '@components/ProductImageCarousel'; // Asegúrate de que la ruta sea correcta

type Product = {
  id: string;
  name: string;
  description: string;
  images: string[];
  variants?: {
    label: string;
    price: number;
  }[];
  longDescription?: string;
};

export default function ProductDetailClient({ product }: { product: Product }) {
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.[0] || { label: 'Único', price: 0 }
  );

  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({
      id: `${product.id}-${selectedVariant.label}`,
      name: `${product.name} - ${selectedVariant.label}`,
      price: selectedVariant.price,
      quantity: 1,
      image: product.images[0], // Primera imagen para el carrito
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Carrusel de imágenes */}
        <div className="w-full max-w-sm mx-auto">
          <ProductImageCarousel images={product.images} alt={product.name} />
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
    ${ (selectedVariant.price * 0.8).toFixed(2) }
  </span>
</div>

          {product.variants && (
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

      {/* Características del producto */}
      {product.longDescription && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2 text-[#A084CA]">Descripción del Producto:</h2>
          <div
            className="prose prose-sm text-gray-700"
            dangerouslySetInnerHTML={{ __html: product.longDescription }}
          />
        </div>
      )}
    </div>
  );
}
