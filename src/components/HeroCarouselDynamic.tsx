// src/components/HeroCarouselDynamic.tsx
"use client";

import { useEffect, useState } from "react";
import Hero from "@components/Hero";
import { fetchActiveSlides, HeroSlide } from "lib/supabase/heroSlides";

const HERO_HEIGHT = "h-[220px] sm:h-[300px] lg:h-[420px]";

// Botón secundario fijo (el de antes)
const FALLBACK_SECONDARY_CTA = {
  label: "¿Cómo comprar?",
  href: "/como-comprar",
};

export default function HeroCarouselDynamic() {
  const [slides, setSlides] = useState<HeroSlide[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchActiveSlides();
        setSlides(data || []);
      } catch (err) {
        console.error("Error cargando banners activos:", err);
        setSlides([]); // marca que terminó de cargar, sin datos
      }
    })();
  }, []);

  // 🟣 Mientras NO sabemos si hay banners → placeholder suave
  if (slides === null) {
    return (
      <div
        className={`w-full overflow-hidden rounded-2xl shadow-lg bg-[#f7ddec] animate-pulse ${HERO_HEIGHT}`}
      />
    );
  }

  // 🟣 Si NO hay banners → no mostramos nada (o podríamos poner fallback viejo si querés)
  if (slides.length === 0) {
    return null;
  }

  // 🟣 Hay banners → usar el primero para los textos
  const first = slides[0];
  const heroSlides = slides.map((s) => s.image_url);

  return (
    <Hero
      slides={heroSlides}
      title={first.title || ""}
      subtitle={
        first.subtitle ||
        ""
      }
      primaryCta={
        first.button_label && first.button_url
          ? { label: first.button_label, href: first.button_url }
          : { label: "Ver productos", href: "/productos" }
      }
      secondaryCta={FALLBACK_SECONDARY_CTA} // 👈 botón secundario de vuelta
      intervalMs={5000}
      heightClasses={HERO_HEIGHT}
    />
  );
}
