// src/data/products.ts
import { sharedLongDescription } from "./sharedDescriptions";

export type Product = {
  id: string;
  name: string;
  slug: string; // 👈 Agregado aquí
  description: string;
  price: number;
  images: string[];
  category: string;
  variants?: {
    label: string;
    price: number;
  }[];
  longDescription?: string; // 👈 reemplaza longDescription
};

export const products: Product[] = [
  {
    id: "1",
    name: "Stitch",
    slug: "kit-imprimible-stitch",
    description: "Kit digital imprimible",
    price: 9375,
    images: [
      "/images/kit-imprimible-stitch.png",
      "/images/invitacion-stitch.png",
    ],
    category: "kits-imprimibles",
    variants: [
      { label: "Refugio Mini", price: 9375 },
      { label: "Refugio Grande", price: 13250 },
    ],
    longDescription:  sharedLongDescription,
  },
  {
    id: "2",
    name: "Capibara Rosa",
    slug: "kit-imprimible-capibara-rosa",
    description: "Kit digital imprimible",
    price: 9375,
    images: [
      "/images/Kit-imprimible-capirosa.png",
      "/images/invitacion-capirosa.png",
    ],
    category: "kits-imprimibles",
    variants: [
      { label: "Refugio Mini", price: 9375 },
      { label: "Refugio Grande", price: 13250 },
    ],
    longDescription:  sharedLongDescription,
  },
  {
    id: "3",
    name: "Dinos",
    slug: "kit-imprimible-dinosaurio",
    description: "Kit digital imprimible",
    price: 9375,
    images: [
      "/images/kit-imprimible-dinosaurio.png",
      "/images/invitacion-dinosaurio.png",
    ],
    category: "kits-imprimibles",
    variants: [
      { label: "Refugio Mini", price: 9375 },
      { label: "Refugio Grande", price: 13250 },
    ],
    longDescription:  sharedLongDescription,
  },
  {
    id: "4",
    name: "Hada Mágica",
    slug: "kit-imprimible-hada",
    description: "Kit digital imprimible",
    price: 9375,
    images: [
      "/images/kit-imprimible-hadas.png",
      "/images/invitacion-hadas.png",
    ],
    category: "kits-imprimibles",
    variants: [
      { label: "Refugio Mini", price: 9375 },
      { label: "Refugio Grande", price: 13250 },
    ],
    longDescription:  sharedLongDescription,
  },
  {
    id: "5",
    name: "Astronauta Espacial",
    slug: "kit-imprimible-astronauta",
    description: "Kit digital imprimible",
    price: 9375,
    images: [
      "/images/Kit-imprimible-astronauta.png",
      "/images/invitacion-astronauta.png",
    ],
    category: "kits-imprimibles",
    variants: [
      { label: "Refugio Mini", price: 9375 },
      { label: "Refugio Grande", price: 13250 },
    ],
    longDescription:  sharedLongDescription,
  },
  {
    id: "6",
    name: "Arcoíris",
    slug: "kit-imprimible-arcoiris",
    description: "Kit digital imprimible",
    price: 9375,
    images: [
      "/images/kit-imprimible-arcoiris.png",
      "/images/invitacion-arcoiris.png",
    ],
    category: "kits-imprimibles",
    variants: [
      { label: "Refugio Mini", price: 9375 },
      { label: "Refugio Grande", price: 13250 },
    ],
    longDescription:  sharedLongDescription,
  },
  {
    id: "7",
    name: "Capibara Verde",
    slug: "kit-imprimible-capibara-verde",
    description: "Kit digital imprimible",
    price: 9375,
    images: [
      "/images/Kit-imprimible-capiverde.png",
      "/images/invitacion-capiverde.png",
    ],
    category: "kits-imprimibles",
    variants: [
      { label: "Refugio Mini", price: 9375 },
      { label: "Refugio Grande", price: 13250 },
    ],
    longDescription:  sharedLongDescription,
  },
];
