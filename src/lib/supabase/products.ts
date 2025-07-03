import { supabase } from "@lib/supabaseClient";
import type { Product } from "types/product";

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      description,
      price,
      discount,
      created_at,
      slug,
      updated_at,
      category,
      images,
      variants,
      is_physical,
      bulk_discounts
    `);

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return (data as Product[]) || [];
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      description,
      price,
      discount,
      created_at,
      slug,
      updated_at,
      category,
      images,
      variants,
      is_physical,
      bulk_discounts
    `)
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching product:", error);
    return null;
  }

  // Transformar variants (name -> label) para mantener compatibilidad
  const transformedVariants = data.variants?.map((v: any) => ({
    label: v.name,
    price: v.price,
  }));

  return {
    ...data,
    variants: transformedVariants || [],
  } as Product;
}
