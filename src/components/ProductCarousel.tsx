'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

type Product = {
  id: number;
  name: string;
  price: string;
  description: string;
  image: string;
};

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
          <div className="bg-white p-4 rounded-xl shadow-md">
            <Image
              src={product.image}
              alt={product.name}
              width={300}
              height={300}
              className="w-full h-60 object-cover rounded-lg mb-4"
            />
            <h3 className="text-xl font-semibold text-acento-lila">{product.name}</h3>
            <p className="text-gray-600">{product.description}</p>
            <p className="text-acento-amarillo font-bold mt-2">{product.price}</p>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}