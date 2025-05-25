'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import type { Product } from '@data/products';

interface ProductCarouselProps {
  products: Product[];
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  if (!products || products.length === 0) {
    return <p className="text-center text-gray-500">No hay productos para mostrar.</p>;
  }

  return (
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
    >
      {products.map((product) => (
        <SwiperSlide key={product.id}>
          <Link href={`/productos/${product.slug}`}>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md h-full min-h-[420px] flex flex-col justify-between hover:shadow-lg transition cursor-pointer">
              <Image
                src={product.images[0]}
                alt={product.name}
                width={300}
                height={300}
                className="w-full h-48 sm:h-56 object-contain rounded-lg mb-3 sm:mb-4"
              />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600">{product.name}</h3>
              <p className="text-sm sm:text-base text-gray-600 line-clamp-1">{product.description}</p>
              <span className="text-gray-400 line-through text-base">${product.variants?.[0].price.toFixed(2) ?? product.price.toFixed(2)}</span>
                <span className="text-lg font-bold text-gray-600">
                  ${ (product.price * 0.8).toFixed(2) }
                </span>
            </div>
          </Link>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
