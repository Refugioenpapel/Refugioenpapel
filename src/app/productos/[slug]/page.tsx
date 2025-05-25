import { notFound } from "next/navigation";
import { products } from "@data/products";
import ProductDetailClient from "./ProductDetailClient";

// Función para generar las rutas estáticas
export function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

// Página del detalle del producto
export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  // Utilizar `await` para resolver el parámetro correctamente
  const slug = await params.slug;  // En versiones experimentales, esto puede ser necesario.

  // Buscar el producto correspondiente al slug
  const product = products.find((p) => p.slug === slug);

  // Si no encontramos el producto, mostramos un error 404
  if (!product) {
    return notFound();
  }

  // Si encontramos el producto, lo renderizamos
  return <ProductDetailClient product={product} />;
}
