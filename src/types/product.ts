export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  price?: number;
  discount?: number;
  original_price?: number;
  longDescription?: string;
  file_url:string;
  category: string;

  // ✅ Variantes del producto (ej. Refugio Mini / Grande)
  variants?: {
    label: string;
    price: number;
  }[];

  // ✅ Si el producto es físico (Souvenir)
  is_physical?: boolean;

  // ✅ Si el producto es destacado
  is_featured?: boolean;

  // ✅ Descuentos por cantidad (sólo para productos físicos)
  bulk_discounts?: {
    min: number;        // cantidad mínima
    max: number | null; // cantidad máxima, o null para "sin límite"
    price: number;      // precio unitario con ese descuento
  }[];
}

