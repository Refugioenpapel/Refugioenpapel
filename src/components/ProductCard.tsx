'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from 'types/product';
import { getBadgeMeta } from '@lib/productBadges';
import BadgePill from '@components/ui/BadgePill';

export default function ProductCard({ product }: { product: Product }) {
  const badge = getBadgeMeta(product);
  const price = product.price ?? 0;
  const discount = product.discount ?? 0;
  const hasDiscount = discount > 0;
  const discountedPrice = (price * (1 - discount / 100)).toFixed(2);

  return (
    <article
      className="
        group relative bg-white rounded-2xl border shadow-sm
        hover:shadow-md transition
      "
    >
      <Link href={`/productos/${product.slug}`} className="block h-full">
        {/* 🔹 Contenedor relativo para que el badge se posicione bien */}
        <div className="relative aspect-[4/3] w-full rounded-t-2xl overflow-hidden">
          {badge && <BadgePill label={badge.label} position="top-left" />}
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 grid place-content-center text-xs text-gray-400">
              Sin imagen
            </div>
          )}
        </div>

        {/* 🔹 Contenido del producto */}
        <div className="p-4 text-left">
          <h3 className="line-clamp-2 text-base font-semibold text-gray-800">
            {product.name}
          </h3>

          {product.description && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
              {product.description} {!product.is_physical && '🖨️'}
            </p>
          )}

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
}
