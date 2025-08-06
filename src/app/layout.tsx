import "./globals.css";
import { Dancing_Script, Nunito, Pacifico, Quicksand } from "next/font/google";
import Navbar from "../components/Navbar";
import { CartProvider } from "../context/CartContext";
import Footer from '../components/footer'; // ajustá la ruta si es necesario
<Footer />
const nunito = Nunito({ subsets: ["latin"], weight: "400", variable: "--font-nunito" });
const pacifico = Pacifico({ subsets: ["latin"], weight: "400", variable: "--font-pacifico" });
const quicksand = Quicksand({ subsets: ["latin"], weight: "700", variable: "--font-quicksand" });
const dancing = Dancing_Script({ subsets: ["latin"], weight: "700", variable: "--font-quicksand" });

export const metadata = {
  title: "Refugio en Papel",
  description: "Papelería creativa, invitaciones digitales, kits imprimibles y decoración de eventos.",
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
        url: "/og-image.png", // asegurate de tener esta imagen
        width: 1200,
        height: 630,
        alt: "Refugio en Papel",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${nunito.variable} ${pacifico.variable} ${quicksand.variable} ${dancing.variable} font-nunito bg-white text-gray-800`}>
        <CartProvider>
          {/* Marquesina fija */}
          <div className="fixed top-0 left-0 right-0 w-full bg-[#FDEFF7] py-2 overflow-hidden z-40">
            <div className="animate-marquee whitespace-nowrap text-sm font-semibold min-w-full inline-block font-quicksand text-[#D85B9C]">
              🚀 ¡COMPRÁ MÁS, PAGÁ MENOS! APROVECHÁ LOS DESCUENTOS POR CANTIDAD EN LA CATEGORÍA SOUVENIRS.
            </div>
          </div>

          {/* Navbar pegajosa debajo */}
          <Navbar />

          {/* Contenido principal con espacio para la marquesina + navbar */}
          <main className="pt-[41px]">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}