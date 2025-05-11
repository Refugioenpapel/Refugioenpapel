'use client'

import { useEffect, useState } from "react";
import Image from "next/image";
import ProductGallery from "../components/ProductGallery";
import ProductCarousel from "../components/ProductCarousel";
import { products } from "../data/products"; // o según tu estructura

const logos = ["/carrusel/banner-carrusel.jpeg"]; // Agregá más: "/carrusel/logo2.png", ...

export default function Home() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % logos.length);
    }, 3000); // cambia cada 3 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pt-0 text-center py-10">
      {/* Carrusel de logos */}
      <div className="mx-auto mb-8 transition-opacity duration-1000 ease-in-out">
        <Image
          src={logos[index]}
          alt={`Logo ${index + 1}`}
          width={1920}
          height={800}
          className="mx-auto shadow-lg object-contain"
        />
      </div>

      <h1 className="text-4xl font-bold text-acento-lila font-quicksand mb-4 text-[#555555]">
        🌈Bienvenid@ a este rincón donde la magia cobra forma de papel
      </h1>
      <p className="text-2xl mx-auto font-quicksand text-[#A56ABF]">
        Creá momentos únicos con diseños imprimibles llenos de ternura, color y amor
      </p>

    {/* Carrusel para destacados */}
      <section className="px-4 sm:px-8 md:px-16 lg:px-32 mt-12">
      <h2 className="text-2xl font-bold text-acento-lila mb-6 text-center">Productos destacados</h2>
      <ProductCarousel products={products} />
      </section>

    {/* Galería completa */}
      <section className="px-4 sm:px-8 md:px-16 lg:px-32 mt-12">
        <h2 className="text-2xl font-bold text-acento-lila mb-6 text-center">Todos los productos</h2>
        <ProductGallery products={products} />
      </section>

    </div>
    
  );
}