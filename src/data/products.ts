// src/data/products.ts

export type Product = {
  id: number;
  name: string;
  description: string;
  price: string;
  image: string;
};

export const products: Product[] = [
  {
    id: 1,
    name: "Cuaderno Floral",
    description: "Cuaderno A5 con tapas ilustradas y hojas lisas.",
    price: "$1.200",
    image: "/productos/cuaderno1.jpg", // Asegurate de tener esta imagen en public/images
  },
  {
    id: 2,
    name: "Planificador Semanal",
    description: "Bloc de planificador semanal con diseño pastel.",
    price: "$900",
    image: "/productos/stickers1.jpg",
  },
  {
    id: 3,
    name: "Stickers Decorativos",
    description: "Set de stickers para decorar agendas o cuadernos.",
    price: "$600",
    image: "/productos/planner1.jpg",
  },
];