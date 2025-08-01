// app/productos/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductGallery from "@components/ProductGallery";
import { supabase } from "@lib/supabaseClient";
import type { Product } from "types/product";

const categoriasDisponibles = [
  { label: "Todos", value: "" },
  { label: "Souvenirs", value: "souvenirs" },
  { label: "Candy Bar y Deco", value: "candy-deco" },
  { label: "Cajitas y Bolsitas", value: "cajitas-bolsitas" },
  { label: "Productos Digitales", value: "productos-digitales" },
  { label: "Archivos Gratis", value: "archivos-gratis" },
];

export default function ProductosPage() {
  const searchParams = useSearchParams();
  const categoria = searchParams?.get("categoria") || "";
  const router = useRouter();
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProductos = async () => {
    setLoading(true);
    let query = supabase
      .from("products")
      .select("id, name, slug, price, description, images, category, discount, is_physical, variants, bulk_discounts");

    if (categoria) {
      query = query.eq("category", categoria);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error al cargar productos:", error.message);
    } else {
      setProductos(data as Product[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProductos();
  }, [categoria]);

  const handleFiltro = (value: string) => {
    router.push(value === "" ? "/productos" : `/productos?categoria=${value}`);
  };

  return (
    <div className="px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#A084CA] mb-6 text-center">
        Nuestros Productos
      </h1>

      {/* Filtros */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 px-2">
        {categoriasDisponibles.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleFiltro(cat.value)}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-full border transition ${
              categoria === cat.value || (!categoria && cat.value === "")
                ? "bg-[#A084CA] text-white border-[#A084CA]"
                : "bg-white text-[#A084CA] border-[#A084CA] hover:bg-[#f4f0fc]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Cargando productos...</p>
      ) : (
        <ProductGallery products={productos} />
      )}
    </div>
  );
}
