// src/app/buscar/page.tsx
"use client";
import { useSearchParams } from "next/navigation";
import { products } from "@data/products"; // Asegurate de tener esto
import Link from "next/link";

export default function BuscarPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("search")?.toLowerCase() || "";

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query)
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        Resultados para: <span className="text-[#A084CA]">{query}</span>
      </h1>

      {filtered.length === 0 ? (
        <p className="text-gray-600">No se encontraron productos.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <Link
              key={product.id}
              href={`/productos/${product.slug}`}
              className="border p-4 rounded shadow hover:shadow-md transition"
            >
              <h2 className="font-semibold">{product.name}</h2>
              <p className="text-sm text-gray-600">${product.price}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
