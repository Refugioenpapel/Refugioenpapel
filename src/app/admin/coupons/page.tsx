// app/admin/coupons/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  fetchAllCoupons,
  upsertCoupon,
  deleteCoupon,
  Coupon,
} from "@lib/supabase/coupons";
import { X } from "lucide-react";

type FormState = {
  id?: string;
  code: string;
  discount_pct: number;
  is_active: boolean;
};

export default function CouponsAdminPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState<FormState>({
    code: "",
    discount_pct: 10,
    is_active: true,
  });

  const load = async () => {
    setLoading(true);
    const data = await fetchAllCoupons();
    setCoupons(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleNew = () => {
    setForm({
      id: undefined,
      code: "",
      discount_pct: 10,
      is_active: true,
    });
    setOpenModal(true);
  };

  const handleEdit = (c: Coupon) => {
    setForm({
      id: c.id,
      code: c.code,
      discount_pct: c.discount_pct,
      is_active: c.is_active,
    });
    setOpenModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este cupón?")) return;
    await deleteCoupon(id);
    load();
  };

  const handleSubmit = async () => {
    if (!form.code.trim()) {
      alert("El código de cupón es obligatorio.");
      return;
    }

    if (form.discount_pct <= 0 || form.discount_pct > 100) {
      alert("El porcentaje debe estar entre 1 y 100.");
      return;
    }

    await upsertCoupon({
      id: form.id,
      code: form.code.trim(),
      discount_pct: form.discount_pct,
      is_active: form.is_active,
    });

    setOpenModal(false);
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Cupones de descuento</h1>
        <button
          onClick={handleNew}
          className="px-4 py-2 rounded-md bg-[#c7a1d9] text-white font-medium"
        >
          Nuevo cupón
        </button>
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : coupons.length === 0 ? (
        <p className="text-gray-500">Todavía no hay cupones creados.</p>
      ) : (
        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Código</th>
              <th className="p-2 text-left">% descuento</th>
              <th className="p-2 text-left">Activo</th>
              <th className="p-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2 font-mono">{c.code}</td>
                <td className="p-2">{c.discount_pct}%</td>
                <td className="p-2">{c.is_active ? "Sí" : "No"}</td>
                <td className="p-2 text-right space-x-3">
                  <button
                    onClick={() => handleEdit(c)}
                    className="text-blue-600 text-xs"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-red-600 text-xs"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-xl relative">
            <button
              onClick={() => setOpenModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X />
            </button>

            <h2 className="text-xl font-semibold mb-4">
              {form.id ? "Editar cupón" : "Nuevo cupón"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Código de cupón
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value }))
                  }
                  className="w-full border rounded-md p-2 text-sm"
                  placeholder="Ej: REFUGIO10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Descuento (%)
                </label>
                <input
                  type="number"
                  value={form.discount_pct}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      discount_pct: Number(e.target.value),
                    }))
                  }
                  className="w-full border rounded-md p-2 text-sm"
                  min={1}
                  max={100}
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_active: e.target.checked }))
                  }
                />
                Cupón activo
              </label>

              <button
                onClick={handleSubmit}
                className="w-full bg-[#ffabcc] text-white py-2 rounded-md mt-3 text-sm font-medium"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
