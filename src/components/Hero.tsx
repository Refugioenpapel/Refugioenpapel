// components/Hero.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type CTA = { label: string; href: string };

type HeroProps = {
  slides: string[];
  title: string;
  subtitle?: string;
  primaryCta?: CTA;
  secondaryCta?: CTA;
  intervalMs?: number;
  heightClasses?: string;
};

export default function Hero({
  slides,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  intervalMs = 5000,
  heightClasses = "max-h-[300px] sm:max-h-[420px] lg:max-h-[560px]",
}: HeroProps) {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (slides.length <= 1) return;

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
        fade ? "opacity-100" : "opacity-0"
      } ${heightClasses}`}
    >
      {/* Imagen / Video */}
      {src.endsWith(".mp4") ? (
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

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/25 to-transparent" />

      {/* Contenido pegado abajo */}
      <div className="absolute inset-0 flex items-end">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
          <div className="max-w-xl text-left">
            {/* Título (Ruluko) */}
            <h1
              className="
                text-white
                font-allura
                drop-shadow
                text-2xl sm:text-3xl lg:text-4xl
              "
            >
              {title}
            </h1>

            {/* Subtítulo (Ruluko) pegadito al título */}
            {subtitle && (
              <p
                className="
                  mt-1
                  text-white/90
                  font-ruluko
                  drop-shadow
                  text-sm sm:text-base lg:text-lg
                "
              >
                {subtitle}
              </p>
            )}

            {/* Botones */}
            {(primaryCta || secondaryCta) && (
              <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                {primaryCta && (
                  <Link
                    href={primaryCta.href}
                    className="
                      rounded-full
                      bg-[var(--rp-button-main)]
                      px-4 py-1.5 sm:px-5 sm:py-2.5
                      text-white
                      hover:brightness-110
                      transition shadow
                      font-ruluko
                      text-xs sm:text-sm lg:text-base
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
                      px-3 py-1 sm:px-4 sm:py-2
                      text-[var(--rp-text)]
                      hover:bg-[var(--rp-marquesina-bg)]
                      transition shadow-sm
                      font-ruluko
                      text-xs sm:text-sm lg:text-base
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
