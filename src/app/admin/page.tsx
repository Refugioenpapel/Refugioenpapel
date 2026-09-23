// app/admin/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductList from "@components/admin/ProductList";
import Link from "next/link";
import { supabase } from "@lib/supabaseClient";

export default function AdminPage() {
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session?.user) {
        console.log("Sesión no encontrada o error:", sessionError);
        router.push("/");
        return;
      }

      const user = sessionData.session.user;
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("rol")
        .eq("id", user.id)
        .single();

      if (profileError || profile?.rol !== "admin") {
        console.log(
          "Acceso denegado: no es admin o error en perfil",
          profileError
        );
        router.push("/");
        return;
      }

      console.log("Acceso concedido: admin");
      setIsAdmin(true);
      setCheckingAccess(false);
    };

    checkUser();
  }, [router]);

  if (checkingAccess) {
    return <p className="p-6">Verificando acceso...</p>;
  }

  return (
    <div className="px-4 py-8 max-w-5xl mx-auto space-y-8">
      <div className="rounded-3xl border border-pink-100 bg-white/70 shadow-sm px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#cc4a72]">
              Refugio en Papel
            </p>
            <h1 className="mt-2 font-allura text-5xl leading-tight text-[#cc4a72] sm:text-6xl">
              Panel de Administración de Sofita
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestioná productos, categorías, banners, cupones y ventas desde un mismo lugar.
            </p>
          </div>

          {/* 🔹 Botones de navegación del admin */}
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Link
              href="/admin/banners"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-pink-300 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-400"
            >
              Banners
            </Link>


            <Link
              href="/admin/coupons"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-pink-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-500"
            >
              Cupones
            </Link>

            <Link
              href="/admin/categorias"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
            >
              Categorías
            </Link>

            <Link
              href="/admin/ventas"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600"
            >
              Ventas
            </Link>

            <Link
              href="/admin/nuevo-producto"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
            >
              Agregar producto
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-200"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {isAdmin && <ProductList />}
    </div>
  );
}
