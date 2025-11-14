// app/page.tsx  (o app/add/page.tsx si ese es tu Home)
'use client';

import { useEffect, useState } from 'react';
import ProductCarousel from '@components/ProductCarousel';
import Hero from '@components/Hero';
import { fetchProducts } from '@lib/supabase/products';
import { transformImagesArray } from '@lib/cloudinary/transformSupabaseUrl';

// Slides del banner principal (podés sumar más)
const slides = ['/carrusel/banner-carrusel.jpg', '/carrusel/banner-carrusel2.jpg'];

export default function Home() {
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const all = await fetchProducts();
      const featured = await fetchProducts({ featuredOnly: true });

      const transformedAll = all.map((p) => ({
        ...p,
        images: transformImagesArray(p.images),
      }));
      const transformedFeatured = featured.map((p) => ({
        ...p,
        images: transformImagesArray(p.images),
      }));

      setAllProducts(transformedAll);
      setFeaturedProducts(transformedFeatured);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* HERO / Banner principal */}
      <Hero
        slides={slides}
        title="✨ Comprá más, pagá menos"
        subtitle="Aprovechá descuentos automáticos por cantidad en souvenirs."
        primaryCta={{ label: 'Ver productos', href: '/productos' }}
        secondaryCta={{ label: '¿Cómo comprar?', href: '/como-comprar' }}
        intervalMs={5000}
        // altura del banner (podés ajustar)
        heightClasses="h-[220px] sm:h-[300px] lg:h-[420px]"
      />

      {/* Destacados */}
      <section className="mt-12">
        <h2 className="mb-4 text-xl sm:text-4xl  text-[#A56ABF] font-just-another-hand text-center">
          PRODUCTOS DESTACADOS
        </h2>
        {loading ? (
          <p className="text-center text-gray-500">Cargando productos…</p>
        ) : featuredProducts.length > 0 ? (
          <ProductCarousel products={featuredProducts} />
        ) : (
          <p className="text-center text-gray-400">No hay productos destacados por ahora.</p>
        )}
      </section>

      {/* Todos los productos */}
      <section className="mt-16">
        <h2 className="mb-4 text-xl sm:text-4xl  text-[#A56ABF] font-just-another-hand text-center">
          TODOS LOS PRODUCTOS
        </h2>
        {loading ? (
          <p className="text-center text-gray-500">Cargando productos…</p>
        ) : (
          <ProductCarousel products={allProducts} />
        )}
      </section>
    </main>
  );
}
