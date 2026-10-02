// app/page.tsx

import ProductCarousel from "@components/ProductCarousel";
import HeroCarouselDynamic from "@components/HeroCarouselDynamic";
import SeasonalOverlay from "@components/SeasonalOverlay";
import { transformImagesArray } from "@lib/cloudinary/transformSupabaseUrl";
import { fetchActiveSlides } from "@lib/supabase/heroSlides";
import { fetchHomeProducts } from "@lib/supabase/products";
import type { Product } from "types/product";

export const revalidate = 300;

function transformProductImages(product: Product): Product {
  return {
    ...product,
    images: transformImagesArray(product.images),
  };
}

export default async function Home() {
  const [products, slides] = await Promise.all([
    fetchHomeProducts(),
    fetchActiveSlides(),
  ]);

  const allProducts = products.map(transformProductImages);
  const featuredProducts = allProducts.filter((product) => product.is_featured);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* 🎄 Overlay navideño sobre toda la home */}
      <SeasonalOverlay />

      {/* HERO / Banner principal dinámico */}
      <HeroCarouselDynamic initialSlides={slides} />

      {/* Destacados */}
      <section className="mt-12">
        <h2 className="mb-4 text-xl sm:text-4xl text-[#A56ABF] font-just-another-hand text-center">
          PRODUCTOS DESTACADOS
        </h2>
        {featuredProducts.length > 0 ? (
          <ProductCarousel products={featuredProducts} />
        ) : (
          <p className="text-center text-gray-400">
            No hay productos destacados por ahora.
          </p>
        )}
      </section>

      {/* Todos los productos */}
      <section className="mt-16">
        <h2 className="mb-4 text-xl sm:text-4xl text-[#A56ABF] font-just-another-hand text-center">
          TODOS LOS PRODUCTOS
        </h2>
        <ProductCarousel products={allProducts} />
      </section>
    </main>
  );
}
