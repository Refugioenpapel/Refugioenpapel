'use client'
import { useEffect, useState } from "react";
import Image from "next/image";
import ProductCarousel from "@components/ProductCarousel";
import { fetchProducts } from "@lib/supabase/products";

const logos = ["/carrusel/banner-carrusel.jpeg"]; // Agregá más: "/carrusel/logo2.png", ...

export default function Home() {
  const [index, setIndex] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // ← Nuevo

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % logos.length);
    }, 3000);

    const getProducts = async () => {
      const data = await fetchProducts();
      setProducts(data);
      setLoading(false); // ← Marca que ya cargó
    };

    getProducts();
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pt-0 text-center py-10">
      {/* Carrusel de logos */}
      <div className="mx-auto mb-12 transition-opacity duration-1000 ease-in-out">
        <Image
          src={logos[index]}
          alt={`Logo ${index + 1}`}
          width={1920}
          height={800}
          className="mx-auto shadow-lg object-contain"
        />
      </div>

      <h1 className="px-4 sm:px-8 max-w-4xl mx-auto text-xl sm:text-2xl md:text-6xl font-dancing font-bold mb-4 text-[#555555]">
        🌈Bienvenid@ a este rincón
      </h1>
      <h1 className="px-4 sm:px-8 max-w-4xl mx-auto text-xl sm:text-2xl md:text-6xl font-dancing font-bold mb-4 text-[#555555]">
        donde la magia cobra forma de papel
      </h1>
      <p className="text-base sm:text-lg md:text-4xl mx-auto font-dancing text-[#A56ABF]">
        Creá momentos únicos con diseños imprimibles llenos de ternura, color y amor
      </p>

      <section className="px-4 sm:px-8 md:px-16 lg:px-32 mt-12">
        <h2 className="text-2xl font-bold text-[#D85B9C] mb-6 text-center">Nuestros productos</h2>
        {loading ? (
          <p className="text-center text-gray-500">Cargando productos...</p>
        ) : (
          <ProductCarousel products={products} />
        )}
      </section>
    </div>
  );
}
