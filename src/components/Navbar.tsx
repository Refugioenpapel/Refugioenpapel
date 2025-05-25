"use client";
import Link from "next/link";
import { Menu, X, ShoppingCart, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react"; // Esto también es necesario para el ícono de eliminar
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { products } from "@data/products";


export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cartItems, removeFromCart, updateQuantity, clearCart, applyCoupon, discount } = useCart();
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const menuRef = useRef<HTMLDivElement>(null);
  const [productosOpen, setProductosOpen] = useState(false);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal - subtotal * discount;

  useEffect(() => {
      if (searchQuery.trim() === "") {
        setSuggestions([]);
        return;
      }
      const matches = products
        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .map(p => p.name);
      setSuggestions(matches.slice(0, 5));
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
        setIsCartOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
console.log("🧾 Items en carrito:", cartItems);
return (
  <>
    <nav className="bg-white text-gray-800 shadow-md sticky top-[40px] z-40">
      <div className="w-full px-4 py-4 flex justify-between items-center relative text-[#A56ABF]">
        <button onClick={toggleMenu}>
          {menuOpen ? <X /> : <Menu />}
        </button>

        <Link
          href="/"
          className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2"
        >
          <Image src="/logo.png" alt="Logo" width={54} height={54} />
        </Link>

        <button onClick={toggleCart} className="relative hover:text-[#A084CA]">
          <ShoppingCart className="w-6 h-6" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 text-xs bg-[#A084CA] text-white rounded-full px-1">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {/* Menú lateral hamburguesa */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-40" onClick={toggleMenu} />
          <div
            ref={menuRef}
            className="relative w-72 max-w-full bg-white shadow-lg p-6 space-y-6 animate-slide-in"
          >
            <div className="flex justify-end">
              <button onClick={toggleMenu} aria-label="Cerrar menú">
                <X className="w-6 h-6 text-gray-600 hover:text-gray-800" />
              </button>
            </div>

            <div className="relative">
              <div className="flex items-center border border-gray-300 rounded-md px-2 py-1">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
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
              {suggestions.length > 0 && (
                <ul className="absolute z-50 bg-white border mt-1 rounded-md shadow-lg w-full text-sm">
                  {suggestions.map((item, index) => (
                    <li
                      key={index}
                      onClick={() => handleSearch(item)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <nav className="flex flex-col space-y-4 text-base font-medium">
              <Link href="/" onClick={toggleMenu} className="hover:text-[#A084CA]">Inicio</Link>
              
              <div>
                <button
                  onClick={() => setProductosOpen(!productosOpen)}
                  className="flex justify-between items-center w-full hover:text-[#A084CA]"
                >
                  Productos
                  <span>{productosOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
</span>
                </button>

                {productosOpen && (
                  <div className="ml-4 mt-2 flex flex-col space-y-2 text-sm text-gray-700">
                    <Link href="/productos?categoria=kits-imprimibles" onClick={toggleMenu}>
                      Kits Imprimibles
                    </Link>
                    <Link href="/productos?categoria=Souvenirs" onClick={toggleMenu}>
                      Souvenirs
                    </Link>
                    <Link href="/productos?categoria=invitaciones-digitales" onClick={toggleMenu}>
                      Invitaciones Digitales
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/sobre-mi" onClick={toggleMenu} className="hover:text-[#A084CA]">Sobre mí</Link>
              <Link href="/contacto" onClick={toggleMenu} className="hover:text-[#A084CA]">Contacto</Link>
            </nav>
          </div>
        </div>
      )}
    </nav>

{/* 🛒 Carrito deslizante */}
<AnimatePresence>
  {isCartOpen && (
    <>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-40 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={toggleCart}
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.3 }}
        className="fixed top-0 right-0 w-80 h-full bg-white z-50 shadow-lg p-6 flex flex-col"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#A084CA]">Tu carrito</h2>
          <button onClick={toggleCart} aria-label="Cerrar carrito">
            <X className="w-6 h-6 text-gray-600 hover:text-gray-800" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {cartItems.length === 0 ? (
            <p className="text-gray-500">Tu carrito está vacío.</p>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="border-b pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-500">Precio: ${item.price}</p>
                    <div className="flex items-center mt-1 gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity === 1}
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700"
                    aria-label={`Eliminar ${item.name}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

{/* Total de la compra */}
<div className="mt-4 border-t pt-4 text-right">
  <p className="text-sm text-gray-600">Subtotal: ${subtotal.toFixed(2)}</p>
    {discount > 0 && (
    <p className="text-sm text-green-600">Descuento aplicado: -{(discount * 100).toFixed(0)}%</p>
  )}
  <p className="text-lg font-semibold text-[#A084CA]">Total: ${total.toFixed(2)}</p>
</div>

        {/* Campo cupón */}
<div className="mt-4">
  <input
    type="text"
    value={coupon}
    onChange={(e) => setCoupon(e.target.value)}
    placeholder="Agregar cupón"
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A084CA]"
  />
  <button
    onClick={() => applyCoupon(coupon)}
    className="mt-2 w-full bg-[#D1B3FF] text-white py-2 rounded-lg hover:bg-[#BFA2E0] transition"
  >
    Aplicar cupón
  </button>
</div>

        {/* Botones finales */}
        <div className="mt-4 space-y-2">
          <button
            onClick={clearCart}
            className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
          >
            Vaciar carrito
          </button>
          <Link href="/checkout" onClick={toggleCart}>
            <button className="w-full bg-[#A084CA] text-white py-2 rounded-lg hover:bg-[#8C6ABF] transition">
              Iniciar compra
            </button>
          </Link>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>
  </>
);
}