// components/ProductCarousel.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from 'types/product';
import { getBadgeMeta } from '@lib/productBadges';
import BadgePill from '@components/ui/BadgePill';

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
          relative flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2
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
                snap-start flex-shrink-0
                basis-[82%] sm:basis-[48%] md:basis-[31%] lg:basis-[23.5%] xl:basis-[18.5%]
              "
            >
              <Link
                href={`/productos/${p.slug}`}
                className="group block h-full rounded-2xl border bg-white shadow-sm hover:shadow-md transition"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl">
                  {badge && <BadgePill label={badge.label} position="top-left" />}
                  {img ? (
                    <Image
                      src={img}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 82vw, (max-width: 768px) 48vw, (max-width: 1024px) 31vw, (max-width: 1280px) 23.5vw, 18.5vw"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-content-center text-xs text-gray-400">
                      Sin imagen
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <h3 className="line-clamp-2 text-base font-semibold text-gray-800">{p.name}</h3>

                  {p.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">{p.description}</p>
                  )}

                  {typeof p.price === 'number' && (
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-[#A084CA]">
                        ${p.price.toFixed(2)}
                      </span>
                    </div>
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
