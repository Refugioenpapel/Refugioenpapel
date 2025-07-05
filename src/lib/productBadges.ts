// lib/productBadges.ts

export function getCategoryBadge(category: string | undefined) {
  switch (category) {
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
