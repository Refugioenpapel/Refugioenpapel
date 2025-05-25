// src/data/products.ts

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
    longDescription: `
      <strong style="color:red;"><br />¡IMPORTANTE!</strong><br /><br />
      - El kit es un archivo digital (no recibirás ningún producto físico). El envío se realizará por mail.<br />
      - Una vez finalizada la compra, recibirás los datos para realizar la transferencia bancaria y luego deberás enviar el comprobante de pago a nuestro correo electrónico: <a href="mailto:mirefugioenpapel@gmail.com">mirefugioenpapel@gmail.com</a> o por WhatsApp: 11-2409-8439.<br /><br />
      <hr />
      <strong><br />Incluye:</strong><br />
      - Una "Guía de papeles y gramajes" con recomendaciones del papel adecuado y consejos para armar cada producto.<br /><br />
      <hr />
      <strong><br />KIT REFUGIO MINI</strong><br /><br />
      - Banderines "Feliz Cumpleaños"<br />
      - Banderines Nombre<br />
      - Banderines Separadores<br />
      - Círculos 6cm<br />
      - Tag<br />
      - Bolsita<br />
      - Invitación Digital<br /><br />
      <hr />
      <strong><br />KIT REFUGIO GRANDE</strong><br /><br />
      - Banderines "Feliz Cumpleaños"<br />
      - Banderines Nombre<br />
      - Banderines Separadores<br />
      - Mini Banderines<br />
      - Círculos 4cm, 6cm, 8cm<br />
      - Tag<br />
      - Toppers de Personajes<br />
      - Pochoclera<br />
      - Bandeja<br />
      - Milk Box<br />
      - Bolsita<br />
      - Cierra Bolsita<br />
      - Caja Cierre Corazón o Cubo (según diseño)<br />
      - Wrappers Cupcake<br />
      - Invitación Digital
      `,
  },
  {
    id: "2",
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
    longDescription: `
      <strong style="color:red;"><br />¡IMPORTANTE!</strong><br /><br />
      - El kit es un archivo digital (no recibirás ningún producto físico). El envío se realizará por mail.<br />
      - Una vez finalizada la compra, recibirás los datos para realizar la transferencia bancaria y luego deberás enviar el comprobante de pago a nuestro correo electrónico: <a href="mailto:mirefugioenpapel@gmail.com">mirefugioenpapel@gmail.com</a> o por WhatsApp: 11-2409-8439.<br /><br />
      <hr />
      <strong><br />Incluye:</strong><br />
      - Una "Guía de papeles y gramajes" con recomendaciones del papel adecuado y consejos para armar cada producto.<br /><br />
      <hr />
      <strong><br />KIT REFUGIO MINI</strong><br /><br />
      - Banderines "Feliz Cumpleaños"<br />
      - Banderines Nombre<br />
      - Banderines Separadores<br />
      - Círculos 6cm<br />
      - Tag<br />
      - Bolsita<br />
      - Invitación Digital<br /><br />
      <hr />
      <strong><br />KIT REFUGIO GRANDE</strong><br /><br />
      - Banderines "Feliz Cumpleaños"<br />
      - Banderines Nombre<br />
      - Banderines Separadores<br />
      - Mini Banderines<br />
      - Círculos 4cm, 6cm, 8cm<br />
      - Tag<br />
      - Toppers de Personajes<br />
      - Pochoclera<br />
      - Bandeja<br />
      - Milk Box<br />
      - Bolsita<br />
      - Cierra Bolsita<br />
      - Caja Cierre Corazón o Cubo (según diseño)<br />
      - Wrappers Cupcake<br />
      - Invitación Digital
      `,
  },
  {
    id: "3",
    name: "Hada Mágica",
    slug: "kit-imprimible-hada",
    description: "Kit digital imprimible",
    price: 9375,
    images: [
      "/images/kit-imprimible-hadas.png",
      "/images/invitacion-hadas.png",
    ],
    category: "invitaciones-digitales",
    variants: [
      { label: "Refugio Mini", price: 9375 },
      { label: "Refugio Grande", price: 13250 },
    ],
    longDescription: `
      <strong style="color:red;"><br />¡IMPORTANTE!</strong><br /><br />
      - El kit es un archivo digital (no recibirás ningún producto físico). El envío se realizará por mail.<br />
      - Una vez finalizada la compra, recibirás los datos para realizar la transferencia bancaria y luego deberás enviar el comprobante de pago a nuestro correo electrónico: <a href="mailto:mirefugioenpapel@gmail.com">mirefugioenpapel@gmail.com</a> o por WhatsApp: 11-2409-8439.<br /><br />
      <hr />
      <strong><br />Incluye:</strong><br />
      - Una "Guía de papeles y gramajes" con recomendaciones del papel adecuado y consejos para armar cada producto.<br /><br />
      <hr />
      <strong><br />KIT REFUGIO MINI</strong><br /><br />
      - Banderines "Feliz Cumpleaños"<br />
      - Banderines Nombre<br />
      - Banderines Separadores<br />
      - Círculos 6cm<br />
      - Tag<br />
      - Bolsita<br />
      - Invitación Digital<br /><br />
      <hr />
      <strong><br />KIT REFUGIO GRANDE</strong><br /><br />
      - Banderines "Feliz Cumpleaños"<br />
      - Banderines Nombre<br />
      - Banderines Separadores<br />
      - Mini Banderines<br />
      - Círculos 4cm, 6cm, 8cm<br />
      - Tag<br />
      - Toppers de Personajes<br />
      - Pochoclera<br />
      - Bandeja<br />
      - Milk Box<br />
      - Bolsita<br />
      - Cierra Bolsita<br />
      - Caja Cierre Corazón o Cubo (según diseño)<br />
      - Wrappers Cupcake<br />
      - Invitación Digital
      `,
  },
  {
    id: "4",
    name: "Astronauta Espacial",
    slug: "kit-imprimible-astronauta",
    description: "Kit digital imprimible",
    price: 9375,
    images: [
      "/images/Kit-imprimible-astronauta.png",
      "/images/invitacion-astronauta.png",
    ],
    category: "Souvenirs",
    variants: [
      { label: "Refugio Mini", price: 9375 },
      { label: "Refugio Grande", price: 13250 },
    ],
    longDescription: `
      <strong style="color:red;"><br />¡IMPORTANTE!</strong><br /><br />
      - El kit es un archivo digital (no recibirás ningún producto físico). El envío se realizará por mail.<br />
      - Una vez finalizada la compra, recibirás los datos para realizar la transferencia bancaria y luego deberás enviar el comprobante de pago a nuestro correo electrónico: <a href="mailto:mirefugioenpapel@gmail.com">mirefugioenpapel@gmail.com</a> o por WhatsApp: 11-2409-8439.<br /><br />
      <hr />
      <strong><br />Incluye:</strong><br />
      - Una "Guía de papeles y gramajes" con recomendaciones del papel adecuado y consejos para armar cada producto.<br /><br />
      <hr />
      <strong><br />KIT REFUGIO MINI</strong><br /><br />
      - Banderines "Feliz Cumpleaños"<br />
      - Banderines Nombre<br />
      - Banderines Separadores<br />
      - Círculos 6cm<br />
      - Tag<br />
      - Bolsita<br />
      - Invitación Digital<br /><br />
      <hr />
      <strong><br />KIT REFUGIO GRANDE</strong><br /><br />
      - Banderines "Feliz Cumpleaños"<br />
      - Banderines Nombre<br />
      - Banderines Separadores<br />
      - Mini Banderines<br />
      - Círculos 4cm, 6cm, 8cm<br />
      - Tag<br />
      - Toppers de Personajes<br />
      - Pochoclera<br />
      - Bandeja<br />
      - Milk Box<br />
      - Bolsita<br />
      - Cierra Bolsita<br />
      - Caja Cierre Corazón o Cubo (según diseño)<br />
      - Wrappers Cupcake<br />
      - Invitación Digital
      `,
  },
];
