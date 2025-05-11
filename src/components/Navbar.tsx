"use client";
import Link from "next/link";
import { Menu, X, ShoppingCart, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Nunito, Pacifico } from "next/font/google";
import Image from "next/image";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });
const nunito = Nunito({ subsets: ["latin"], weight: "400" });

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Cierra el menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setMenuOpen(false);
    }
  };

  if (menuOpen) {
    window.addEventListener("keydown", handleKeyDown);
  }

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [menuOpen]);

  return (
    <nav className="bg-white text-gray-800 shadow-md sticky top-[40px] z-40">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center relative">

        {/* Menú hamburguesa a la izquierda */}
        <button onClick={toggleMenu}>
          {menuOpen ? <X /> : <Menu />}
        </button>

        {/* Logo centrado */}
        <Link href="/" className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
          <Image src="/logo.png" alt="Logo" width={54} height={54} />
        </Link>

        {/* Carrito a la derecha */}
        <Link href="/carrito" className="relative hover:text-[#A084CA]">
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 text-xs bg-[#A084CA] text-white rounded-full px-1">
            2
          </span>
        </Link>
      </div>

      {/* Modal de menú */}
      {menuOpen && (
  <div className="fixed inset-0 z-50 flex">
    {/* Fondo oscurecido detrás del menú */}
    <div
      className="fixed inset-0 bg-black bg-opacity-40"
      onClick={toggleMenu}
    />

    {/* Panel lateral con animación */}
    
    <div
      ref={menuRef}
      className="relative w-72 max-w-full bg-white shadow-lg p-6 space-y-6 animate-slide-in"
    >
      <div className="flex justify-end">
  <button onClick={toggleMenu} aria-label="Cerrar menú">
    <X className="w-6 h-6 text-gray-600 hover:text-gray-800" />
  </button>
</div>
      {/* Campo de búsqueda */}
      <div className="flex items-center border border-gray-300 rounded-md px-2 py-1">
        <Search className="w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar..."
          className="ml-2 outline-none text-sm bg-transparent w-full"
        />
      </div>

      {/* Enlaces */}
      <nav className="flex flex-col space-y-4 text-base font-medium">
        <Link href="/" onClick={toggleMenu} className="hover:text-[#A084CA]">Inicio</Link>
        <Link href="/productos" onClick={toggleMenu} className="hover:text-[#A084CA]">Productos</Link>
        <Link href="/sobre-mi" onClick={toggleMenu} className="hover:text-[#A084CA]">Sobre mí</Link>
        <Link href="/contacto" onClick={toggleMenu} className="hover:text-[#A084CA]">Contacto</Link>
      </nav>
    </div>
  </div>
)}
    </nav>
  );
}
