'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import type { Product } from "../types/product";

interface ProductCarouselProps {
  products: Product[];
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  if (!products || products.length === 0) {
    return <p className="text-center text-gray-500">No hay productos para mostrar.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <Swiper
        modules={[Navigation, Pagination, A11y]}
        spaceBetween={20}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        breakpoints={{
          640: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        className="w-full"
      >
        {products.map((product) => {
          const discount = product.discount ?? 0;
          const hasDiscount = discount > 0;

          const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
          const variants = product.variants ?? [];

          const minVariantPrice = hasVariants
            ? Math.min(...variants.map((v) => v.price))
            : null;

          const basePrice = hasVariants
            ? minVariantPrice ?? 0
            : product.price ?? 0;

          const discountedPrice = (basePrice * (1 - discount / 100)).toFixed(2);

          return (
            <SwiperSlide key={product.id}>
              <Link href={`/productos/${product.slug}`}>
                <div className="relative bg-white p-4 sm:p-6 rounded-xl shadow-md h-full min-h-[420px] flex flex-col justify-between hover:shadow-lg transition cursor-pointer">
                  
                  {/* Badge de descuento */}
                  {hasDiscount && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full z-10">
                      {discount}% OFF
                    </span>
                  )}

                  {/* Imagen */}
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={300}
                      height={300}
                      className="w-full h-48 sm:h-56 object-contain rounded-lg mb-3 sm:mb-4"
                    />
                  ) : (
                    <div className="w-full h-48 sm:h-56 flex items-center justify-center bg-gray-100 rounded-lg mb-3 sm:mb-4">
                      <span className="text-gray-400">Sin imagen</span>
                    </div>
                  )}

                  {/* Título y descripción */}
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-600">{product.name}</h3>
                  {product.description && (
                    <p className="text-sm sm:text-base text-gray-600 line-clamp-1">{product.description} 🖨️</p>
                  )}

                  {/* Precios */}
                  <div className="mt-2">
                    {hasDiscount ? (
                      <>
                        <span className="text-sm text-gray-400 line-through block">
                          Desde ${basePrice.toFixed(2)}
                        </span>
                        <span className="text-base font-bold text-pink-600">
                          🔥Desde ${discountedPrice}
                        </span>
                      </>
                    ) : (
                      <span className="text-base font-bold text-gray-700">
                        Desde ${basePrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Botón Ver Más */}
      <Link href="/productos">
        <button className="px-6 py-2 bg-[#A084CA] text-white rounded-full hover:bg-[#8C6ABF] transition">
          Ver más productos
        </button>
      </Link>
    </div>
  );
}
