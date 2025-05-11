'use client';
import Image from "next/image";

type Product = {
  id: number;
  name: string;
  price: string;
  description: string;
  image: string;
};

interface ProductGalleryProps {
  products: Product[];
}

export default function ProductGallery({ products }: ProductGalleryProps) {
  if (!Array.isArray(products) || products.length === 0) {
    return <p className="text-center text-gray-500">No hay productos disponibles.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {products.map((product) => (
        <div key={product.id} className="bg-white p-4 rounded-xl shadow-md">
          <Image
            src={product.image}
            alt={product.name}
            width={300}
            height={300}
            className="w-full h-60 object-cover rounded-lg mb-4"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.src = "/fallback.jpg"; // Asegurate de tener fallback.jpg en /public
            }}
          />
          <h3 className="text-xl font-semibold text-acento-lila">{product.name}</h3>
          <p className="text-gray-600">{product.description}</p>
          <p className="text-acento-amarillo font-bold mt-2">{product.price}</p>

          {/* 🧡 Futuro: botón de favorito */}
          {/* <button onClick={() => toggleFavorite(product.id)}>⭐</button> */}
        </div>
      ))}
    </div>
  );
}