import { supabase } from "@lib/supabaseClient";
import type { Product } from "types/product";

const HOME_PRODUCTS_SELECT = `
  id,
  name,
  slug,
  description,
  category,
  price,
  discount,
  images,
  image_public_ids,
  is_featured,
  badge_label,
  variants,
  bulk_threshold_qty,
  bulk_discount_pct
`;

// Mapea variantes de la BD a la forma que usa tu UI
function mapVariants(dbVariants: any[] | null | undefined) {
  if (!Array.isArray(dbVariants)) return [];
  // En BD pueden venir como { name, price } o { label, price }
  return dbVariants.map((v) => ({
    label: typeof v?.label === "string" ? v.label : (v?.name ?? ""),
    price: Number(v?.price ?? 0),
  }));
}

export async function fetchProducts(options?: {
  category?: string;
  featuredOnly?: boolean;
}): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select('*')
    .order("id", { ascending: false });

  if (options?.category) query = query.eq("category", options.category);
  if (options?.featuredOnly) query = query.eq("is_featured", true);

  // si usás soft-delete y NO querés mostrar eliminados al público:
  // query = query.is("deleted_at", null);

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    ...row,
    variants: mapVariants(row.variants),
  })) as Product[];
}

export async function fetchHomeProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(HOME_PRODUCTS_SELECT)
    .order("id", { ascending: false });

  if (error) {
    console.error("Error fetching home products:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    ...row,
    variants: mapVariants(row.variants),
  })) as Product[];
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select('*')
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching product:", error);
    return null;
  }

  return {
    ...data,
    variants: mapVariants((data as any)?.variants),
  } as Product;
}
