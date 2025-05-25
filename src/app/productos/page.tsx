"use client";

import { useSearchParams, useRouter } from "next/navigation";
import ProductGallery from "@components/ProductGallery";
import { products } from "@data/products";

const categoriasDisponibles = [
  { label: "Todos", value: "" },
  { label: "Kits Imprimibles", value: "kits-imprimibles" },
  { label: "Souvenirs", value: "Souvenirs" },
  { label: "Invitaciones Digitales", value: "invitaciones-digitales" },
];

export default function ProductosPage() {
  const searchParams = useSearchParams();
  const categoria = searchParams.get("categoria");
  const router = useRouter();

  const productosFiltrados = categoria
    ? products.filter((p) => p.category === categoria)
    : products;

  const handleFiltro = (value: string) => {
    if (value === "") {
      router.push("/productos");
    } else {
      router.push(`/productos?categoria=${value}`);
    }
  };

  return (
    <div className="px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#A084CA] mb-6 text-center">
        Nuestros Productos
      </h1>

      {/* Filtros de categoría responsivos */}
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

      <ProductGallery products={productosFiltrados} />
    </div>
  );
}
