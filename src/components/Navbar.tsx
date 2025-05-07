"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Pacifico } from "next/font/google";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <nav className="bg-[#FADADD] text-gray-800 shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className={`${pacifico.className} text-2xl text-[#A084CA]`}>
          Refugio en Papel
        </Link>

        <div className="hidden md:flex space-x-6 text-sm font-medium">
          <Link href="/" className="hover:text-[#A084CA]">Inicio</Link>
          <Link href="/productos" className="hover:text-[#A084CA]">Productos</Link>
          <Link href="/sobre-mi" className="hover:text-[#A084CA]">Sobre mí</Link>
          <Link href="/contacto" className="hover:text-[#A084CA]">Contacto</Link>
        </div>

        <button className="md:hidden" onClick={toggleMenu}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden px-4 pb-4 flex flex-col space-y-2 text-sm font-medium">
          <Link href="/" className="hover:text-[#A084CA]" onClick={toggleMenu}>Inicio</Link>
          <Link href="/productos" className="hover:text-[#A084CA]" onClick={toggleMenu}>Productos</Link>
          <Link href="/sobre-mi" className="hover:text-[#A084CA]" onClick={toggleMenu}>Sobre mí</Link>
          <Link href="/contacto" className="hover:text-[#A084CA]" onClick={toggleMenu}>Contacto</Link>



        </div>
      )}
    </nav>
  );
}
