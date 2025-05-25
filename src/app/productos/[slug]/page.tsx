import { notFound } from "next/navigation";
import { products } from "@data/products";
import ProductDetailClient from "./ProductDetailClient";

type PageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = products.find((p) => p.slug === params.slug);

  if (!product) return notFound();

  return <ProductDetailClient product={product} />;
}
