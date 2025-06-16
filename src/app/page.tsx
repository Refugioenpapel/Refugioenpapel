'use client'
import { useEffect, useState } from "react";
import Image from "next/image";
import ProductCarousel from "@components/ProductCarousel";
import { fetchProducts } from "@lib/supabase/products";

// Carrusel: imágenes y videos
const logos = [
  "/carrusel/banner-carrusel.mp4",
  "/carrusel/banner-video1.mp4",
  "/carrusel/banner-video2.mp4"
];

export default function Home() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true); // Nuevo: para manejar opacidad
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // inicia el fade out

      setTimeout(() => {
        setIndex((prev) => (prev + 1) % logos.length); // cambio de slide
        setFade(true); // inicia el fade in
      }, 300); // duración del fade out
    }, 5000); // cambio cada 5 segundos

    const getProducts = async () => {
      const data = await fetchProducts();
      setProducts(data);
      setLoading(false);
    };

    getProducts();
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pt-0 text-center py-10">
      {/* Carrusel con efecto fade */}
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
