// components/Hero.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type CTA = { label: string; href: string };

type HeroProps = {
  slides: string[];                 // rutas de imágenes (o videos *.mp4)
  title: string;
  subtitle?: string;
  primaryCta?: CTA;
  secondaryCta?: CTA;
  intervalMs?: number;              // default 5000
  heightClasses?: string;           // default: "max-h-[300px] sm:max-h-[420px] lg:max-h-[560px]"
};

export default function Hero({
  slides,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  intervalMs = 5000,
  heightClasses = 'max-h-[300px] sm:max-h-[420px] lg:max-h-[560px]',
}: HeroProps) {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % slides.length);
        setFade(true);
      }, 250);
    }, intervalMs);
    return () => clearInterval(id);
  }, [slides.length, intervalMs]);

  const src = slides[index];

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl shadow-lg transition-opacity duration-300 ${
        fade ? 'opacity-100' : 'opacity-0'
      } ${heightClasses}`}
    >
      {/* Imagen / Video */}
      {src.endsWith('.mp4') ? (
        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <Image
          src={src}
          alt={`Slide ${index + 1}`}
          fill
          className="object-cover"
          priority
        />
      )}

      {/* Overlay degradado */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/25 to-transparent" />

      {/* Contenido */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl text-left">
            <h1
              className="
                text-white text-2xl sm:text-3xl lg:text-4xl
                font-[var(--font-just-another-hand)]
                drop-shadow
              "
            >
              {title}
            </h1>

            {subtitle && (
              <p
                className="
                  mt-2 text-white/90 text-sm sm:text-base drop-shadow
                  font-[var(--font-ruluko)]
                "
              >
                {subtitle}
              </p>
            )}

            {(primaryCta || secondaryCta) && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {primaryCta && (
                  <Link
                    href={primaryCta.href}
                    className="
                      rounded-full
                      bg-[var(--rp-button-main)]
                      px-5 py-2.5
                      text-white
                      hover:brightness-110
                      transition shadow
                    "
                  >
                    {primaryCta.label}
                  </Link>
                )}

                {secondaryCta && (
                  <Link
                    href={secondaryCta.href}
                    className="
                      rounded-full
                      bg-[var(--rp-button-secondary)]
                      border border-[var(--rp-text)]
                      px-5 py-2.5
                      text-[var(--rp-text)]
                      hover:bg-[var(--rp-marquesina-bg)]
                      transition shadow-sm
                    "
                  >
                    {secondaryCta.label}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
