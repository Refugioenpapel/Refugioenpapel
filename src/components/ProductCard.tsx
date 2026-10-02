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
        group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-pink-100/80
        bg-white shadow-sm shadow-pink-100/70 transition duration-300
        hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-100
      "
    >
      <Link href={`/productos/${product.slug}`} className="flex h-full min-w-0 flex-col">
        {/* 🔹 Formato vertical para lucir mejor fotos tomadas en portrait */}
        <div className="relative m-1.5 mb-0 aspect-square overflow-hidden rounded-[1rem] bg-[#fff8fa] sm:m-2 sm:aspect-[3/4] sm:rounded-[1.1rem]">
          {badge && <BadgePill label={badge.label} position="top-left" />}
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 grid place-content-center text-xs text-gray-400">
              Sin imagen
            </div>
          )}
        </div>

        {/* 🔹 Contenido del producto */}
        <div className="flex flex-1 min-w-0 flex-col px-2.5 pb-3 pt-2 text-center sm:px-4 sm:pb-4 sm:pt-3">
          <h3 className="min-h-[1rem] truncate text-[0.76rem] font-bold uppercase leading-tight tracking-[0.01em] text-gray-800 sm:min-h-[1.25rem] sm:text-[0.95rem]">
            {product.name}
          </h3>

          <p className="mt-1.5 min-h-[0.95rem] truncate text-[0.72rem] leading-snug text-gray-500 sm:mt-2 sm:min-h-[2.1rem] sm:line-clamp-2 sm:text-sm">
            {product.description || '\u00a0'}
          </p>

          <PriceBlock
            className="mt-3 sm:mt-3"
            price={product.price ?? 0}
            discountPct={product.discount ?? 0}
            priceClassName="text-sm font-bold text-[#A084CA] sm:text-[1.05rem]"
            compareClassName="text-xs text-gray-400 line-through sm:text-sm"
            transferClassName="mt-0.5 text-[0.72rem] leading-tight text-gray-500 sm:text-sm"
            align="center"
          />
        </div>
      </Link>
    </article>
  );
}
