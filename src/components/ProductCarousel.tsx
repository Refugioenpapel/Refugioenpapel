// components/ProductCarousel.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from 'types/product';
import { getBadgeMeta } from '@lib/productBadges';
import BadgePill from '@components/ui/BadgePill';
import PriceBlock from '@components/ui/PriceBlock';

type Props = {
  title?: string;
  products: Product[];
  ctaHref?: string;
  ctaLabel?: string;
};

export default function ProductCarousel({
  title = '',
  products,
  ctaHref = '/productos',
  ctaLabel = 'Ver más productos',
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByViewport = (dir: 'left' | 'right') => {
    const el = trackRef.current;
    if (!el) return;
    const viewportWidth = el.clientWidth;
    el.scrollBy({
      left: dir === 'right' ? viewportWidth : -viewportWidth,
      behavior: 'smooth',
    });
  };

  return (
    <section className="relative">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-semibold text-[#A56ABF]">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            aria-label="Anterior"
            onClick={() => scrollByViewport('left')}
            className="rounded-full border p-2 hover:bg-gray-50 transition shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            aria-label="Siguiente"
            onClick={() => scrollByViewport('right')}
            className="rounded-full border p-2 hover:bg-gray-50 transition shadow-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="
          relative flex items-stretch gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 pt-1 sm:gap-4
          [-ms-overflow-style:none] [scrollbar-width:none]
        "
        style={{ scrollbarWidth: 'none' } as any}
      >
        <style jsx>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>

        {products.map((p) => {
          const img = p.images?.[0];
          const badge = getBadgeMeta(p);

          return (
            <article
              key={p.id}
              className="
                snap-start flex-shrink-0 self-stretch
                basis-[calc((100%_-_0.75rem)/2)] sm:basis-[calc((100%_-_1rem)/2)] md:basis-[calc((100%_-_2rem)/3)] lg:basis-[calc((100%_-_3rem)/4)] xl:basis-[calc((100%_-_4rem)/5)]
              "
            >
              <Link
                href={`/productos/${p.slug}`}
                className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[1.1rem] border border-pink-100/80 bg-white shadow-sm shadow-pink-100/70 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-100 sm:rounded-[1.35rem]"
              >
                <div className="relative m-1.5 mb-0 aspect-square overflow-hidden rounded-[1rem] bg-[#fff8fa] sm:m-2 sm:aspect-[3/4] sm:rounded-[1.1rem]">
                  {badge && <BadgePill label={badge.label} position="top-left" />}
                  {img ? (
                    <Image
                      src={img}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 43vw, (max-width: 1024px) 29vw, (max-width: 1280px) 22.5vw, 18vw"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-content-center text-xs text-gray-400">
                      Sin imagen
                    </div>
                  )}
                </div>

                <div className="flex flex-1 min-w-0 flex-col px-2.5 pb-3 pt-2 text-center sm:px-4 sm:pb-4 sm:pt-3">
                  <h3 className="block min-h-[1rem] w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[0.76rem] font-bold uppercase leading-tight tracking-[0.01em] text-gray-800 sm:min-h-[1.25rem] sm:text-[0.95rem]">{p.name}</h3>

                  <p className="mt-1.5 min-h-[0.95rem] truncate text-[0.72rem] leading-snug text-gray-500 sm:mt-2 sm:min-h-[2.1rem] sm:line-clamp-2 sm:text-sm">{p.description || '\u00a0'}</p>

                  {typeof p.price === 'number' && (
                    <PriceBlock
                      className="mt-3 sm:mt-3"
                      price={p.price}
                      discountPct={p.discount ?? 0}
                      priceClassName="text-sm font-bold text-[#A084CA] sm:text-[1.05rem]"
                      compareClassName="text-xs text-gray-400 line-through sm:text-sm"
                      transferClassName="mt-0.5 text-[0.72rem] leading-tight text-gray-500 sm:text-sm"
                      align="center"
                    />
                  )}
                </div>
              </Link>
            </article>
          );
        })}
      </div>

      {/* CTA */}
      {ctaHref && (
        <div className="mt-6 flex justify-center">
          <Link
            href={ctaHref}
            className="rounded-full bg-[#A084CA] px-5 py-2.5 text-white shadow hover:bg-[#8C6ABF] transition"
          >
            {ctaLabel}
          </Link>
        </div>
      )}
    </section>
  );
}
