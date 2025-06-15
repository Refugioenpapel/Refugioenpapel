"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchProducts } from "@lib/supabase/products";

export default function BuscarPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("search")?.toLowerCase() || "";
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((product) => {
            const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
            const variants = product.variants ?? [];

            const minVariantPrice = hasVariants
              ? Math.min(...variants.map((v: { price: number }) => v.price))
              : null;

            const discountedVariantPrice = minVariantPrice
              ? minVariantPrice * 0.8
              : null;

            const hasDiscount = hasVariants || product.original_price;

            return (
              <Link
                key={product.id}
                href={`/productos/${product.slug}`}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow hover:shadow-lg transition duration-300 flex flex-col relative"
              >
                {/* Badge de descuento */}
                {hasDiscount && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full z-10">
                    20% OFF
                  </span>
                )}

                <div className="w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                  <img
                    src={product.images?.[0] || "/placeholder.png"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-1">
                    {product.name}
                  </h3>

                  {product.description && (
                    <p className="text-sm sm:text-base text-gray-600 line-clamp-1">
                      {product.description} 🖨️
                    </p>
                  )}

                  <div className="mt-2">
                    {hasVariants ? (
                      <>
                        <span className="text-sm text-gray-400 line-through block">
                          Desde ${minVariantPrice?.toFixed(2)}
                        </span>
                        <span className="text-base font-bold">
                          🔥Desde ${discountedVariantPrice?.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <>
                        {product.original_price && (
                          <span className="text-sm text-gray-400 line-through block">
                            ${product.original_price.toFixed(2)}
                          </span>
                        )}
                        <span className="text-base font-bold text-pink-600">
                          ${product.price?.toFixed(2) ?? '—'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
