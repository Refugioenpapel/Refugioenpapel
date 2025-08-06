// lib/productBadges.ts
import { Product } from 'types/product';

export function getProductBadge(product: Product | undefined) {
  if (!product) return null;

  // ✅ Excepciones por slug
  const customBadgesBySlug: Record<string, { text: string; className: string } | null> = {
    'kit-imprimible-nene': null, // ❌ No mostrar badge aunque sea 'souvenirs'
    'librito': {
      text: 'Descuento desde 30 u.',
      className: 'bg-red-200 text-gray-600 text-[10px] font-medium px-2 py-[2px] rounded shadow-sm',
    },
    // podés seguir agregando excepciones acá
  };

  const customBadge = customBadgesBySlug[product.slug];
  if (customBadge !== undefined) {
    return customBadge; // puede ser un badge o `null` para no mostrar nada
  }

  // ✅ Fallback por categoría (si no hay excepción por slug)
  switch (product.category) {
    case 'souvenirs':
      return {
        text: 'Descuento desde 10 u.',
        className: 'bg-red-200 text-gray-600 text-[10px] font-medium px-2 py-[2px] rounded shadow-sm',
      };
    case 'decoracion-de-fiesta':
      return {
        text: 'Ideal para decorar',
        className: 'bg-blue-200 text-gray-600 text-[10px] font-medium px-2 py-[2px] rounded shadow-sm',
      };
    case 'golosinas-personalizadas':
      return {
        text: 'CandyBar ideal',
        className: 'bg-green-200 text-gray-600 text-[10px] font-medium px-2 py-[2px] rounded shadow-sm',
      };
    default:
      return null;
  }
}
