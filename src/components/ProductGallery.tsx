// components/ProductGallery.tsx
'use client';

import Image from 'next/image';
import type { Product } from 'types/product';
import ProductCard from '@components/ProductCard';

interface ProductGalleryProps {
  products: Product[];
}

export default function ProductGallery({ products }: ProductGalleryProps) {
  if (!Array.isArray(products) || products.length === 0) {
    return (
      <div className="text-center flex flex-col items-center justify-center py-12">
        <div className="animate-bounce mb-4">
          <Image
            src="/coming-soon-icon.png"
            alt="Próximamente"
            width={100}
            height={100}
            className="mb-4"
          />
        </div>
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2 animate-fadeIn">
          ¡Productos en camino!
        </h3>
        <p className="text-sm sm:text-base text-gray-500 animate-fadeIn">
          Esta categoría estará disponible pronto. ¡Mantente atento!
        </p>
      </div>
    );
  }

  return (
    <div
      className="
        grid grid-cols-2 gap-3
        sm:grid-cols-2 
        sm:gap-5
        md:grid-cols-3 
        lg:grid-cols-4 
        xl:grid-cols-5 
        px-1 sm:px-4
      "
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
