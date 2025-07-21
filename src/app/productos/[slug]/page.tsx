// src/app/productos/[slug]/page.tsx
import { notFound } from "next/navigation";
import { fetchProductBySlug } from "@lib/supabase/products";
import ProductDetailClient from "./ProductDetailClient";

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await fetchProductBySlug(params.slug);

  if (!product) {
    console.log("Producto no encontrado para slug:", params.slug);
    return notFound();
  }

  return <ProductDetailClient product={product} />;
}
