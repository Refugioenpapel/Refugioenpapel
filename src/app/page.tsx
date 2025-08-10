'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import ProductCarousel from "@components/ProductCarousel";
import { fetchProducts } from "@lib/supabase/products";
import { transformImagesArray } from "@lib/cloudinary/transformSupabaseUrl";

// Carrusel: imágenes y videos
const logos = [
  "/carrusel/banner-carrusel.jpg",
  "/carrusel/banner-carrusel2.jpg"
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

      // Reemplazar imágenes por versiones de Cloudinary
      const transformedAll = all.map((product) => ({
        ...product,
        images: transformImagesArray(product.images),
      }));

      const transformedFeatured = featured.map((product) => ({
        ...product,
        images: transformImagesArray(product.images),
      }));

      setAllProducts(transformedAll);
      setFeaturedProducts(transformedFeatured);
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
            className="mx-auto w-full max-h-[300px] sm:max-h-[400px] lg:max-h-[650px] object-contain shadow-lg rounded-xl"
          />
        ) : (
          <Image
            src={logos[index]}
            alt={`Slide ${index + 1}`}
            width={1500}
            height={400}
            className="mx-auto w-full max-h-[300px] sm:max-h-[400px] lg:max-h-[650px] object-contain shadow-lg rounded-xl"
          />
        )}
      </div>

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
