// lib/productBadges.ts
import type { Product } from "types/product";

export type BadgeMeta = { label: string } | null;

function normalizeCategory(s?: string) {
  // minúsculas, sin tildes, espacios -> guiones
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

/** Reglas de badge: primero excepciones por slug, luego por categoría. */
export function getBadgeMeta(product?: Product): BadgeMeta {
  if (!product) return null;

  const slug = (product.slug || "").toLowerCase();
  const cat = normalizeCategory(product.category);

  // 0) Badge específico por producto
  if (typeof product.badge_label === 'string' && product.badge_label.trim() !== '') {
    return { label: product.badge_label.trim() };
  }

  // 1) Excepciones por slug (null = no mostrar)
  const bySlug: Record<string, BadgeMeta> = {
    "kit-imprimible-nene": null,
    "librito": { label: "Descuento desde 30 u." },
    "candy-deco": { label: "Descuento desde 30 u." }, // <-- OJO: si esto fuera categoría no aplicará aquí
    "tarjetadulce": { label: "Descuento desde 30 u." },
    "minilibrito-actividades": { label: "Descuento desde 30 u." },
  };

  if (Object.prototype.hasOwnProperty.call(bySlug, slug)) {
    return bySlug[slug]; // puede devolver badge o null
  }

  // 2) Fallback por categoría (usar el nombre "slugificado")
  const byCategory: Record<string, BadgeMeta> = {
    // Dejar vacío para que no haya badges automáticos por categoría.
    // Si querés agregar un badge por categoría, definilo aquí.
    // "candy-deco": { label: "Candy-Decoración" },
    // "productos-digitales": { label: "Ideal para decorar" },
  };

  if (Object.prototype.hasOwnProperty.call(byCategory, cat)) {
    return byCategory[cat];
  }

  return null;
}
