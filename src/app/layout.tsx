import "./globals.css";
import { Nunito, Pacifico, Quicksand } from "next/font/google";
import Navbar from "../components/Navbar";

const nunito = Nunito({ subsets: ["latin"], weight: "400", variable: "--font-nunito" });
const pacifico = Pacifico({ subsets: ["latin"], weight: "400", variable: "--font-pacifico" });
const quicksand = Quicksand({ subsets: ["latin"], weight: "700", variable: "--font-quicksand" });

export const metadata = {
  title: "Refugio en Papel",
  description: "Papelería creativa y artesanal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${nunito.variable} ${pacifico.variable} ${quicksand.variable} font-nunito bg-fondo text-gray-800`}>

        {/* Marquesina fija */}
        <div className="fixed top-0 left-0 right-0 w-full bg-[#FDEFF7] py-2 overflow-hidden z-40">
          <div className="animate-marquee whitespace-nowrap text-sm font-semibold min-w-full inline-block font-quicksand text-[#D85B9C]">
            PROMOCIÓN DE LANZAMIENTO: 20% OFF EN TODOS LOS KITS IMPRIMIBLES - 🛒 ¡APROVECHÁ EL DESCUENTO!
          </div>
        </div>

        {/* Navbar pegajosa debajo */}
        <Navbar />

        {/* Contenido principal con espacio para la marquesina + navbar */}
        <main className="pt-[41px]">{children}</main>
      </body>
    </html>
  );
}
