import "./globals.css";
import {
  Dancing_Script,
  Nunito,
  Pacifico,
  Quicksand,
} from "next/font/google";

import { Just_Another_Hand, Allura, Ruluko } from "next/font/google";

import Navbar from "../components/Navbar";
import { CartProvider } from "../context/CartContext";
import Footer from "../components/footer";

// Fuentes existentes
const nunito = Nunito({ subsets: ["latin"], weight: "400", variable: "--font-nunito" });
const pacifico = Pacifico({ subsets: ["latin"], weight: "400", variable: "--font-pacifico" });
const quicksand = Quicksand({ subsets: ["latin"], weight: "700", variable: "--font-quicksand" });
const dancing = Dancing_Script({ subsets: ["latin"], weight: "700", variable: "--font-dancing" });
const justanotherhand = Just_Another_Hand({ weight: '400', subsets: ['latin'], variable: '--font-just-another-hand',});

// Nuevas fuentes para “Cómo Comprar”
const allura = Allura({ weight: "400", subsets: ["latin"], variable: "--font-allura" });
const ruluko = Ruluko({ weight: "400", subsets: ["latin"], variable: "--font-ruluko" });

export const metadata = {
  title: "Refugio en Papel",
  description:
    "Papelería creativa, invitaciones digitales, kits imprimibles y decoración de eventos.",
  keywords: ["papelería", "kits imprimibles", "invitaciones digitales", "Refugio en Papel"],
  authors: [{ name: "Refugio en Papel", url: "https://www.refugioenpapel.com.ar" }],
  creator: "Refugio en Papel",
  metadataBase: new URL("https://www.refugioenpapel.com.ar"),
  openGraph: {
    title: "Refugio en Papel",
    description: "Papelería creativa, kits imprimibles y más",
    url: "https://www.refugioenpapel.com.ar",
    siteName: "Refugio en Papel",
    icons: {
      icon: "/favicon.ico",
    },
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Refugio en Papel",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
};

// src/app/layout.tsx (solo la parte del JSX)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`
        ${nunito.variable}
        ${pacifico.variable}
        ${quicksand.variable}
        ${dancing.variable}
        ${justanotherhand.variable}
        ${allura.variable}
        ${ruluko.variable}
      `}
    >
      <body className="font-nunito bg-[#FFF8FA] text-[#444444]">
        <CartProvider>
         {/* ⭐ Marquesina fija */}
          <div className="fixed top-0 left-0 right-0 w-full z-40">
            {/* Fondo principal de marquesina */}
            <div className="bg-[#e6dbd8] py-0.5 overflow-hidden">
              <div className="
                animate-marquee
                whitespace-nowrap
                text-[1.35rem]
                leading-none
                min-w-full
                inline-block
                text-[#444444]
                font-just-another-hand
              ">
                10% OFF EN SOUVENIRS DESDE 20 UNIDADES • ENVÍOS A TODO EL PAÍS
              </div>
            </div>

  {/* Barrita rosa de abajo */}
  <div className="w-full h-[4px] bg-[#ffabcc]" />
</div>




          {/* ⭐ Navbar pegajosa */}
          <Navbar />

          {/* ⭐ Contenido con espacio para la marquesina + navbar */}
          <main className="pt-[32px]">{children}</main>

          {/* ⭐ Footer */}
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}

