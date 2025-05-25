import { notFound } from "next/navigation";
import { products } from "@data/products";
import ProductDetailClient from "./ProductDetailClient";

// Función para generar las rutas estáticas
export function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

// Hacemos la función asincrónica para resolver los parámetros de forma correcta
export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  // Esperamos los parámetros correctamente
  const { slug } = await params;

  // Buscamos el producto correspondiente al slug
  const product = products.find((p) => p.slug === slug);

  // Si no encontramos el producto, mostramos un error 404
  if (!product) {
    return notFound();
  }

  // Si encontramos el producto, lo renderizamos con el cliente de detalle
  return <ProductDetailClient product={product} />;
}
