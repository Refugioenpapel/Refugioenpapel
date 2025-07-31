// components/ProductGallery.tsx

'use client';
import Image from "next/image";
import Link from "next/link";
import type { Product } from 'types/product';
import { getCategoryBadge } from '@lib/productBadges';

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
    <div className="text-center grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-4">
      {products.map((product) => {
        const price = product.price ?? 0;
        const discount = product.discount ?? 0;
        const hasDiscount = discount > 0;
        const discountedPrice = (price * (1 - discount / 100)).toFixed(2);
        const badge = getCategoryBadge(product.category);

        return (
          <div
            key={product.id}
            className="relative bg-white p-4 sm:p-6 rounded-xl shadow-md flex flex-col h-full"
          >
            {/* Badge por categoría (si corresponde) */}
            {badge && (
              <span className={`absolute top-2 right-2 z-10 ${badge.className}`}>
                {badge.text}
              </span>
            )}

            <Link href={`/productos/${product.slug}`} className="flex-1">
              <div className="hover:shadow-lg transition cursor-pointer flex flex-col h-full">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  width={300}
                  height={300}
                  className="w-full h-48 sm:h-60 object-contain rounded-lg mb-3 sm:mb-4"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src = "/fallback.jpg";
                  }}
                />

                <h3 className="text-lg sm:text-xl font-semibold text-gray-600">
                  {product.name}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  {product.description} {!product.is_physical && '🖨️'}
                </p>

                <div className="items-center gap-2 mt-2">
                  {hasDiscount ? (
                    <>
                      <span className="text-gray-400 line-through text-sm block">
                        {!product.is_physical && 'Desde'} ${price.toFixed(2)}
                      </span>
                      <span className="text-lg font-bold text-gray-600">
                        {!product.is_physical && '🔥 Desde'} ${discountedPrice}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-gray-600">
                      {!product.is_physical && 'Desde'} ${price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
