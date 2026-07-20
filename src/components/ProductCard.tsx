'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from 'types/product';
import { getBadgeMeta } from '@lib/productBadges';
import BadgePill from '@components/ui/BadgePill';
import PriceBlock from '@components/ui/PriceBlock';

export default function ProductCard({ product }: { product: Product }) {
  const badge = getBadgeMeta(product);

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
        <div className="p-4 text-center">
          <h3 className="line-clamp-2 text-base font-semibold text-gray-800">
            {product.name}
          </h3>

          {product.description && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
              {product.description}
            </p>
          )}

          <PriceBlock
            className="mt-3"
            price={product.price ?? 0}
            discountPct={product.discount ?? 0}
            priceClassName="text-lg font-bold text-[#A084CA]"
            compareClassName="text-gray-400 line-through text-sm"
            transferClassName="text-sm text-gray-500"
            align="center"
          />
        </div>
      </Link>
    </article>
  );
}
