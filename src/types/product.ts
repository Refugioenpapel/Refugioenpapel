// /src/types/product.ts
export interface Product {
  id: string | number;

  name: string;
  slug: string;
  description: string;
  category: string;

  // precios
  price?: number;
  discount?: number | null;
  original_price?: number;

  longDescription?: string;
  file_url?: string;

  // imágenes
  images: string[];                 // legacy: secure_url
  image_public_ids?: string[];      // NUEVO: public_id (Cloudinary)

  // variantes (tu storefront usa label/price)
  variants?: {
    label: string;
    price: number;
  }[];

  // flags
  is_physical?: boolean;
  is_featured?: boolean;

  // LEGACY (se va deprecando, pero lo dejamos para compat)
  bulk_discounts?: {
    min: number;
    max: number | null;
    price: number;
  }[];

  // NUEVO esquema “umbral + %”
  bulk_threshold_qty?: number | null; // p.ej. 25
  bulk_discount_pct?: number | null;  // p.ej. 10.00

  // housekeeping
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;        // soft delete opcional
}
