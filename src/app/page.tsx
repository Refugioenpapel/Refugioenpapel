'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import ProductCarousel from "@components/ProductCarousel";
import { fetchProducts } from "@lib/supabase/products";

// Carrusel: imágenes y videos
const logos = [
  "/carrusel/banner-carrusel.jpg",
  "/carrusel/banner-video1.mp4"
];

export default function Home() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % logos.length);
        setFade(true);
      }, 300);
    }, 5000);

    const getProducts = async () => {
      const all = await fetchProducts(); // Todos los productos
      const featured = await fetchProducts({ featuredOnly: true }); // Solo destacados

      setAllProducts(all);
      setFeaturedProducts(featured);
      setLoading(false);
    };

    getProducts();
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pt-0 text-center py-10">
      {/* Carrusel principal con fade */}
      <div
        className={`mb-12 transition-opacity duration-500 ease-in-out w-full overflow-hidden ${
          fade ? "opacity-100" : "opacity-0"
        }`}
      >
        {logos[index].endsWith(".mp4") ? (
          <video
            src={logos[index]}
            autoPlay
            muted
            loop
            playsInline
            className="mx-auto w-full h-auto object-contain shadow-lg"
          />
        ) : (
          <Image
            src={logos[index]}
            alt={`Slide ${index + 1}`}
            width={1920}
            height={800}
            className="mx-auto shadow-lg object-contain"
          />
        )}
      </div>

      <h1 className="px-4 sm:px-8 max-w-4xl mx-auto text-xl sm:text-2xl md:text-6xl font-dancing font-bold mb-4 text-[#555555]">
        🌈Bienvenid@ a este rincón
      </h1>
      <h1 className="px-4 sm:px-8 max-w-4xl mx-auto text-xl sm:text-2xl md:text-6xl font-dancing font-bold mb-4 text-[#555555]">
        donde la magia cobra forma de papel
      </h1>
      <p className="max-w-md sm:max-w-xl md:max-w-3xl text-base sm:text-lg md:text-4xl mx-auto font-dancing text-[#A56ABF]">
        Creá momentos únicos con diseños imprimibles llenos de ternura, color y amor
      </p>

      {/* Carrusel de productos destacados */}
      <section className="px-4 sm:px-8 md:px-16 lg:px-32 mt-16">
        <h2 className="text-xl sm:text-2xl font-bold text-[#D85B9C] mb-6 text-center">✨ Productos destacados</h2>
        {loading ? (
          <p className="text-center text-gray-500">Cargando productos...</p>
        ) : featuredProducts.length > 0 ? (
          <ProductCarousel products={featuredProducts} />
        ) : (
          <p className="text-center text-gray-400">No hay productos destacados por ahora.</p>
        )}
      </section>

      {/* Carrusel de todos los productos */}
      <section className="px-4 sm:px-8 md:px-16 lg:px-32 mt-16">
        <h2 className="text-2xl font-bold text-[#D85B9C] mb-6 text-center">Nuestros productos</h2>
        {loading ? (
          <p className="text-center text-gray-500">Cargando productos...</p>
        ) : (
          <ProductCarousel products={allProducts} />
        )}
      </section>
    </div>
  );
}
