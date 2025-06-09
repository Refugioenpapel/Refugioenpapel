export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  price?: number;
  original_price?: number;
  longDescription?: string;
  variants?: {
    label: string;
    price: number;
  }[];
  category: string; // ← agregá esta línea
}
