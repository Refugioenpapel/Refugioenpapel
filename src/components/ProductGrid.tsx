// components/ProductGrid.tsx
"use client";

import type { Product } from "types/product";
import ProductCard from "@components/ProductCard";

type Props = { products: Product[] };

export default function ProductGrid({ products }: Props) {
  if (!products?.length) {
    return <p className="text-center text-gray-400">No hay productos por ahora.</p>;
  }

  return (
    <div
      className="
        grid gap-4
        sm:grid-cols-2
        md:grid-cols-3
        lg:grid-cols-4
        xl:grid-cols-5
      "
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
