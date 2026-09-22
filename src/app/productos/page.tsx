// app/productos/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductGallery from "@components/ProductGallery";
import { supabase } from "@lib/supabaseClient";
import { fetchCategoryOptions, type CategoryOption } from "@lib/supabase/categories";
import type { Product } from "types/product";

export default function ProductosPage() {
  const searchParams = useSearchParams();
  const categoria = searchParams?.get("categoria") || "";
  const router = useRouter();
  const [productos, setProductos] = useState<Product[]>([]);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategorias, setLoadingCategorias] = useState(true);

  const fetchProductos = async () => {
    setLoading(true);
    let query = supabase
      .from("products")
      .select('*');

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

  useEffect(() => {
    const fetchCategorias = async () => {
      setLoadingCategorias(true);
      const categories = await fetchCategoryOptions();
      setCategoriasDisponibles(categories);
      setLoadingCategorias(false);
    };

    fetchCategorias();
  }, []);

  const handleFiltro = (value: string) => {
    router.push(value === "" ? "/productos" : `/productos?categoria=${encodeURIComponent(value)}`);
  };

  return (
    <div className="px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#A084CA] mb-6 text-center">
        Nuestros Productos
      </h1>

      {/* Filtros */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 px-2">
        {[{ label: "Todos", value: "" }, ...categoriasDisponibles].map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleFiltro(cat.value)}
            disabled={loadingCategorias && cat.value !== ""}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-full border transition ${
              categoria === cat.value || (!categoria && cat.value === "")
                ? "bg-[#A084CA] text-white border-[#A084CA]"
                : "bg-white text-[#A084CA] border-[#A084CA] hover:bg-[#f4f0fc]"
            } ${loadingCategorias && cat.value !== "" ? "opacity-60 cursor-not-allowed" : ""}`}
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
