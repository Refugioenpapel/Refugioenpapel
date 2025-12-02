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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Panel de administración</h1>

        {/* 🔹 Botones de navegación del admin */}
        <div className="flex gap-2">
          
          <Link
            href="/admin/banners"
            className="bg-pink-300 text-white px-4 py-2 rounded hover:bg-pink-400 text-sm"
          >
            Banners
          </Link>
          

          <Link
            href="/admin/coupons"
            className="bg-pink-400 text-white px-4 py-2 rounded hover:bg-pink-500 text-sm"
          >
            Cupones
          </Link>

          <Link
            href="/admin/nuevo-producto"
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
          >
            Agregar producto
          </Link>

          <button
            onClick={handleLogout}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 text-sm"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {isAdmin && <ProductList />}
    </div>
  );
}
