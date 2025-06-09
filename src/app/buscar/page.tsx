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
          {filtered.map((product) => (
            <Link
              key={product.id}
              href={`/productos/${product.slug}`}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow hover:shadow-lg transition duration-300 flex flex-col"
            >
              <div className="w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                <img
                  src={product.images?.[0] || "/placeholder.png"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <h2 className="font-semibold text-[#A084CA] text-lg mb-1">{product.name}</h2>
                <div className="text-sm text-gray-600 mt-auto">
                  <span className="line-through text-gray-400 mr-2">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="font-bold text-[#6C4AB6]">
                    ${(product.price * 0.8).toFixed(2)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
