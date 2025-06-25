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
  onImageClick?: (src: string, index: number) => void; // ahora acepta click
}

export default function ProductImageCarousel({ images, alt, onImageClick }: ProductImageCarouselProps) {
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
          <div
            className="relative group cursor-zoom-in"
            onClick={() => onImageClick?.(src, index)}
          >
            <Image
              src={src}
              alt={`${alt} - imagen ${index + 1}`}
              width={600}
              height={600}
              className="w-full object-contain rounded-xl"
            />
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
