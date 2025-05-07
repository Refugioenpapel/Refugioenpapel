import "./globals.css";
import { Nunito } from "next/font/google";
import Navbar from "../components/Navbar";

const nunito = Nunito({ subsets: ["latin"], weight: "400" });

export const metadata = {
  title: "Refugio en Papel",
  description: "Papelería creativa y artesanal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${nunito.className} bg-[#FFF7E8] text-gray-800`}>
        <Navbar />
        <main className="pt-6">{children}</main>
      </body>
    </html>
  );
}