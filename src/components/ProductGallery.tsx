import Image from "next/image";

const products = [
  {
    id: 1,
    name: "Cuaderno Floral",
    price: "$1500",
    description: "Hecho a mano con papel reciclado y detalles en glitter.",
    image: "/producto1.jpg", // imagen de ejemplo
  },
  {
    id: 2,
    name: "Planner Semanal",
    price: "$1200",
    description: "Ideal para organizar tus días con estilo.",
    image: "/producto2.jpg",
  },
  {
    id: 3,
    name: "Stickers Vintage",
    price: "$800",
    description: "Pack de 50 stickers para decorar lo que quieras.",
    image: "/producto3.jpg",
  },
];

export default function ProductGallery() {
  return (
    <section className="px-4 py-8 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center text-[#A084CA]">Productos</h2>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-2xl shadow-md border border-[#D1D1D1] p-4 hover:shadow-lg transition-all"
          >
            <div className="relative w-full h-48 rounded-xl overflow-hidden mb-3">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            <h3 className="text-lg font-semibold text-[#A084CA]">{product.name}</h3>
            <p className="text-sm text-gray-600 mb-1">{product.description}</p>
            <p className="font-bold text-[#FFF4B1] text-base">{product.price}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
