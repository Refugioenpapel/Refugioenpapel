// src/components/ProductImageCarousel.tsx
'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface ProductImageCarouselProps {
  images: string[];
  alt: string;
}

export default function ProductImageCarousel({ images, alt }: ProductImageCarouselProps) {
  return (
    <Swiper
      modules={[Navigation, Pagination, A11y]}
      navigation
      pagination={{ clickable: true }}
      spaceBetween={10}
      className="rounded-xl"
    >
      {images.map((src, index) => (
        <SwiperSlide key={index}>
          <Image
            src={src}
            alt={`${alt} - imagen ${index + 1}`}
            width={600}
            height={600}
            className="w-full object-contain rounded-xl"
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
