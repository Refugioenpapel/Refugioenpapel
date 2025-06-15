"use client";

import { useEffect, useRef, useState } from "react";
import { debounce } from "lodash"; // 📌 Agregamos lodash para debounce
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Menu,
  X,
  ShoppingCart,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useCart } from "@context/CartContext";
import { fetchProducts } from "@lib/supabase/products";
import type { Product } from "types/product";

type ProductWithPrice = Product & { price: number };

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [productosOpen, setProductosOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProductWithPrice[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { cartItems, openCart, closeCart } = useCart();
const [hasMounted, setHasMounted] = useState(false);

useEffect(() => {
  setHasMounted(true);
}, []);

const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // ✅ Función para cargar sugerencias, con debounce
  const loadSuggestions = debounce(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const all = await fetchProducts();
    const matches = all
      .filter((p): p is ProductWithPrice => typeof p.price === "number")
      .filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5);

    setSuggestions(matches);
  }, 300); // 300ms debounce

  // ✅ useEffect para escuchar cambios en `searchQuery`
  useEffect(() => {
    loadSuggestions(searchQuery);
    return () => loadSuggestions.cancel(); // 🧹 Limpia debounce si se desmonta
  }, [searchQuery]);

  const handleSearch = (value: string) => {
    router.push(`/buscar?search=${encodeURIComponent(value)}`);
    setMenuOpen(false);
    setSearchQuery("");
    setSuggestions([]);
  };

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
        closeCart();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <nav className="bg-white text-gray-800 shadow-md sticky top-[40px] z-40">
        <div className="w-full px-4 py-4 flex justify-between items-center relative text-[#A56ABF]">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>

          <Link
            href="/"
            className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2"
          >
            <Image src="/logo.png" alt="Logo" width={54} height={54} />
          </Link>

          <button onClick={openCart} className="relative hover:text-[#A084CA]">
            <ShoppingCart className="w-6 h-6" />
            {hasMounted && totalItems > 0 && (
              <span className="absolute -top-2 -right-2 text-xs bg-[#A084CA] text-white rounded-full px-1">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Menú hamburguesa */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black bg-opacity-40"
              onClick={() => setMenuOpen(false)}
            />
            <div
              ref={menuRef}
              className="relative w-72 max-w-full bg-white shadow-lg p-6 space-y-6 animate-slide-in"
            >
              <div className="flex justify-end">
                <button onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">
                  <X className="w-6 h-6 text-gray-600 hover:text-gray-800" />
                </button>
              </div>

              {/* Buscador */}
              <div className="relative">
                <div className="flex items-center border border-gray-300 rounded-md px-2 py-1">
                  <Search className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    name="search"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchQuery.trim() !== "") {
                        handleSearch(searchQuery);
                      }
                    }}
                    className="ml-2 outline-none text-sm bg-transparent w-full"
                  />
                </div>

                {/* Sugerencias */}
                {suggestions.length > 0 && (
                  <ul className="absolute z-50 bg-white border mt-1 rounded-md shadow-lg w-full text-sm">
                    {suggestions.map((item) => (
                      <li
                        key={item.id}
                        onClick={() => handleSearch(item.name)}
                        className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                      >
                        <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                          {item.images?.length > 0 ? (
                            <Image
                              src={item.images[0]}
                              alt={item.name}
                              width={48}
                              height={48}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                              Sin imagen
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Links del menú */}
              <nav className="flex flex-col space-y-4 text-base font-medium">
                <Link href="/" onClick={() => setMenuOpen(false)} className="hover:text-[#A084CA]">
                  Inicio
                </Link>

                <div>
                  <button
                    onClick={() => setProductosOpen(!productosOpen)}
                    className="flex justify-between items-center w-full hover:text-[#A084CA]"
                  >
                    Productos
                    {productosOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {productosOpen && (
                    <div className="ml-4 mt-2 flex flex-col space-y-2 text-sm text-gray-700">
                      <Link href="/productos?categoria=decoracion-de-fiesta" onClick={() => setMenuOpen(false)}>
                        Decoración de Fiesta
                      </Link>
                      <Link href="/productos?categoria=golosinas-personalizadas" onClick={() => setMenuOpen(false)}>
                        Golosinas Personalizadas
                      </Link>
                      <Link href="/productos?categoria=souvenirs" onClick={() => setMenuOpen(false)}>
                        Souvenirs
                      </Link>
                      <Link href="/productos?categoria=invitaciones-digitales" onClick={() => setMenuOpen(false)}>
                        Invitaciones Digitales
                      </Link>
                    </div>
                  )}
                </div>

                <Link href="/sobre-mi" onClick={() => setMenuOpen(false)} className="hover:text-[#A084CA]">
                  Sobre mí
                </Link>
                <Link href="/contacto" onClick={() => setMenuOpen(false)} className="hover:text-[#A084CA]">
                  Contacto
                </Link>
              </nav>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
