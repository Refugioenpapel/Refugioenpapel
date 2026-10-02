// app/buscar/page.tsx

'use client';

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchProducts } from "@lib/supabase/products";
import PriceBlock from "@components/ui/PriceBlock";

export default function BuscarPage() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("search")?.toLowerCase() ?? "";
  const [filtered, setFiltered] = useState<any[]>([]);

  useEffect(() => {
    async function loadProducts() {
      const all = await fetchProducts();
      const matches = all.filter((p) => p.name.toLowerCase().includes(query));
      setFiltered(matches);
    }
    loadProducts();
  }, [query]);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
        Resultados para: <span className="text-[#A084CA]">{query}</span>
      </h1>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-600">No se encontraron productos.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => {
            const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
            const variants = product.variants ?? [];

            const minVariantPrice = hasVariants
              ? Math.min(...variants.map((v: { price: number }) => v.price))
              : product.price;

            const finalPrice = minVariantPrice;

            return (
              <Link
                key={product.id}
                href={`/productos/${product.slug}`}
                className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.1rem] border border-gray-200 bg-white shadow transition duration-300 hover:shadow-lg sm:rounded-2xl"
              >
                {/* Badge de descuento */}
                {/* Se ha quitado el descuento para mostrarlo solo cuando se decida usarlo */}
                {product.discount && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full z-10">
                    {product.discount}% OFF
                  </span>
                )}

                <div className="flex aspect-square w-full items-center justify-center overflow-hidden bg-gray-50">
                  <img
                    src={product.images?.[0] || "/placeholder.png"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex flex-1 min-w-0 flex-col p-2.5 text-center sm:p-4">
                  <h3 className="mb-1 min-h-[1rem] truncate text-[0.76rem] font-semibold uppercase leading-tight text-gray-600 sm:min-h-[1.5rem] sm:text-lg sm:normal-case">
                    {product.name}
                  </h3>

                  <p className="min-h-[0.95rem] truncate text-[0.72rem] leading-snug text-gray-600 sm:min-h-[1.5rem] sm:text-sm">
                    {product.description || "\u00a0"}
                  </p>

                  {hasVariants ? (
                    <PriceBlock
                      className="mt-3"
                      price={finalPrice ?? null}
                      discountPct={product.discount ?? 0}
                      prefix={!product.is_physical ? "🔥 Desde" : undefined}
                      priceClassName="text-sm font-bold sm:text-base"
                      transferClassName="text-[0.72rem] leading-tight text-gray-500 sm:text-sm"
                      align="center"
                    />
                  ) : (
                    <PriceBlock
                      className="mt-3"
                      price={finalPrice ?? null}
                      discountPct={product.discount ?? 0}
                      priceClassName="text-sm font-bold text-pink-600 sm:text-base"
                      transferClassName="text-[0.72rem] leading-tight text-gray-500 sm:text-sm"
                      align="center"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
