// components/Navbar.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { debounce } from "lodash";
import { useRouter } from "next/navigation";
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

  // ✅ Sugerencias con debounce
  const loadSuggestions = debounce(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const all = await fetchProducts();
    const matches = all
      .filter((p): p is ProductWithPrice => typeof p.price === "number")
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);

    setSuggestions(matches);
  }, 300);

  useEffect(() => {
    loadSuggestions(searchQuery);
    return () => loadSuggestions.cancel();
  }, [searchQuery]);

  const handleSearch = (value: string) => {
    router.push(`/buscar?search=${encodeURIComponent(value)}`);
    setMenuOpen(false);
    setSearchQuery("");
    setSuggestions([]);
  };

  // Cerrar menú al click afuera
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

  // ESC cierra menú + carrito
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        closeCart();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeCart]);

  return (
    <>
      {/* Barra rosa principal */}
      <nav className="bg-[#FFABCC] text-[#444444] shadow-md sticky top-[28px] z-40">
        {/* Header con título centrado */}
        <div className="w-full px-4 py-6 flex items-center justify-between relative">
          {/* Botón menú (hamburguesa) con ancho fijo */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-[#cc4a72] hover:opacity-80 transition w-10 flex justify-start"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>

          {/* Marca central: Refugio en Papel */}
          <Link
            href="/"
            className="text-3xl font-allura text-[#FFF8FA] text-center absolute left-1/2 -translate-x-1/2"
          >
            Refugio en Papel
          </Link>

          {/* Carrito con ancho fijo */}
          <button
            onClick={openCart}
            className="relative hover:opacity-80 transition text-[#cc4a72] w-10 flex justify-end"
          >
            <ShoppingCart className="w-6 h-6" />
            {hasMounted && totalItems > 0 && (
              <span className="absolute -top-2 -right-2 text-xs bg-[#c7a1d9] text-white rounded-full px-1">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Menú hamburguesa (drawer) */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-40"
              onClick={() => setMenuOpen(false)}
            />
            {/* Panel lateral */}
            <div
              ref={menuRef}
              className="relative w-72 max-w-full bg-white shadow-lg p-6 space-y-6 animate-slide-in"
            >
              <div className="flex justify-end">
                <button
                  onClick={() => setMenuOpen(false)}
                  aria-label="Cerrar menú"
                >
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
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.images[0]}
                              alt={item.name}
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
              <nav className="flex flex-col space-y-4 text-base font-medium text-[#444444]">
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="hover:text-[#cc4a72]"
                >
                  Inicio
                </Link>

                <div>
                  <button
                    onClick={() => setProductosOpen(!productosOpen)}
                    className="flex justify-between items-center w-full hover:text-[#cc4a72]"
                  >
                    Productos
                    {productosOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {productosOpen && (
                    <div className="ml-4 mt-2 flex flex-col space-y-2 text-sm text-gray-700">
                      <Link
                        href="/productos?categoria=souvenirs"
                        onClick={() => setMenuOpen(false)}
                      >
                        Souvenirs
                      </Link>
                      <Link
                        href="/productos?categoria=candy-deco"
                        onClick={() => setMenuOpen(false)}
                      >
                        Candy Bar y Deco
                      </Link>
                      <Link
                        href="/productos?categoria=productos-digitales"
                        onClick={() => setMenuOpen(false)}
                      >
                        Productos Digitales
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  href="/como-comprar"
                  onClick={() => setMenuOpen(false)}
                  className="hover:text-[#cc4a72]"
                >
                  ¿Cómo comprar?
                </Link>
                <Link
                  href="/contacto"
                  onClick={() => setMenuOpen(false)}
                  className="hover:text-[#cc4a72]"
                >
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
