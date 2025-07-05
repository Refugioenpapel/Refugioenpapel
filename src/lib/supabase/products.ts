import { supabase } from "@lib/supabaseClient";
import type { Product } from "types/product";

// Acepta filtros opcionales: por categoría o por destacados
export async function fetchProducts(options?: { category?: string; featuredOnly?: boolean }): Promise<Product[]> {
  let query = supabase
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
      bulk_discounts,
      is_featured
    `);

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  if (options?.featuredOnly) {
    query = query.eq("is_featured", true);
  }

  const { data, error } = await query;

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
      bulk_discounts,
      is_featured
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
