// components/ProductGallery.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from 'types/product';
import BadgePill from '@components/ui/BadgePill';
import { getBadgeMeta } from '@lib/productBadges';

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
        grid gap-5 
        grid-cols-1 
        sm:grid-cols-2 
        md:grid-cols-3 
        lg:grid-cols-4 
        xl:grid-cols-5 
        px-2 sm:px-4
      "
    >
      {products.map((product) => {
        const price = product.price ?? 0;
        const discount = product.discount ?? 0;
        const hasDiscount = discount > 0;
        const discountedPrice = (price * (1 - discount / 100)).toFixed(2);
        const badge = getBadgeMeta(product);

        return (
          <article
            key={product.id}
            className="
              group relative bg-white rounded-2xl border shadow-sm
              hover:shadow-md transition overflow-hidden
            "
          >
            {/* Badge (mismo estilo del carrusel) */}
            {badge && <BadgePill label={badge.label} />}

            <Link href={`/productos/${product.slug}`}>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl">
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="
                      object-cover transition-transform duration-300 
                      group-hover:scale-[1.02]
                    "
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = '/fallback.jpg';
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 grid place-content-center text-xs text-gray-400">
                    Sin imagen
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-5 text-left">
                <h3 className="line-clamp-2 text-base font-semibold text-gray-800">
                  {product.name}
                </h3>

                <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                  {product.description} {!product.is_physical && '🖨️'}
                </p>

                <div className="mt-3 flex items-baseline gap-2">
                  {hasDiscount ? (
                    <>
                      <span className="text-gray-400 line-through text-sm">
                        ${price.toFixed(2)}
                      </span>
                      <span className="text-lg font-bold text-[#A084CA]">
                        ${discountedPrice}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-[#A084CA]">
                      ${price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
