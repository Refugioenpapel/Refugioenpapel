"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminAccess } from "hooks/useAdminAccess";
import {
  CategoryRow,
  countProductsByCategory,
  createCategoryAsAdmin,
  deleteCategoryAsAdmin,
  fetchAdminCategories,
  updateCategoryNameAsAdmin,
} from "@lib/supabase/categories";

type CategoryWithUsage = CategoryRow & {
  productsCount: number;
};

export default function AdminCategoriasPage() {
  const { isAdmin, loading } = useAdminAccess();
  const [categories, setCategories] = useState<CategoryWithUsage[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadCategories = async () => {
    setFetching(true);
    setMessage(null);

    try {
      const rows = await fetchAdminCategories();
      const withUsage = await Promise.all(
        rows.map(async (category) => ({
          ...category,
          productsCount: await countProductsByCategory(category.name),
        }))
      );

      setCategories(withUsage);
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "No se pudieron cargar las categorías." });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadCategories();
  }, [isAdmin]);

  const handleCreate = async () => {
    const cleanName = newCategoryName.trim();

    if (!cleanName) {
      setMessage({ type: "error", text: "Ingresá un nombre para la categoría." });
      return;
    }

    if (categories.some((category) => category.name.toLowerCase() === cleanName.toLowerCase())) {
      setMessage({ type: "error", text: "Ya existe una categoría con ese nombre." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await createCategoryAsAdmin(cleanName);
      setNewCategoryName("");
      setMessage({ type: "success", text: "Categoría creada correctamente." });
      await loadCategories();
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message ?? "No se pudo crear la categoría." });
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (category: CategoryWithUsage) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setMessage(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleUpdate = async (category: CategoryWithUsage) => {
    const cleanName = editingName.trim();

    if (!cleanName) {
      setMessage({ type: "error", text: "El nombre de la categoría no puede estar vacío." });
      return;
    }

    if (
      categories.some(
        (item) => item.id !== category.id && item.name.toLowerCase() === cleanName.toLowerCase()
      )
    ) {
      setMessage({ type: "error", text: "Ya existe otra categoría con ese nombre." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await updateCategoryNameAsAdmin(category.id, category.name, cleanName);
      setEditingId(null);
      setEditingName("");
      setMessage({
        type: "success",
        text:
          category.productsCount > 0
            ? `Categoría actualizada. También se actualizaron ${category.productsCount} producto${
                category.productsCount === 1 ? "" : "s"
              } que la usaban.`
            : "Categoría actualizada correctamente.",
      });
      await loadCategories();
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message ?? "No se pudo editar la categoría." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: CategoryWithUsage) => {
    if (category.productsCount > 0) {
      setMessage({
        type: "error",
        text: `No se puede eliminar "${category.name}" porque hay ${category.productsCount} producto${
          category.productsCount === 1 ? "" : "s"
        } usando esta categoría. Primero cambiá esos productos a otra categoría.`,
      });
      return;
    }

    if (!confirm(`¿Eliminar la categoría "${category.name}"?`)) return;

    setSaving(true);
    setDeletingId(category.id);
    setMessage(null);

    try {
      await deleteCategoryAsAdmin(category);
      setMessage({ type: "success", text: "Categoría eliminada correctamente." });
      await loadCategories();
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message ?? "No se pudo eliminar la categoría." });
    } finally {
      setSaving(false);
      setDeletingId(null);
    }
  };

  if (loading) return <p className="p-6">Verificando acceso...</p>;
  if (!isAdmin) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Categorías</h1>
          <p className="text-sm text-gray-600 mt-1">
            Administrá las categorías que aparecen en productos, filtros públicos y menú.
          </p>
        </div>
        <Link
          href="/admin"
          className="w-fit rounded bg-gray-200 px-4 py-2 text-sm text-gray-800 hover:bg-gray-300"
        >
          Volver al panel
        </Link>
      </div>

      {message && (
        <div
          className={`rounded border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Agregar categoría</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleCreate();
            }}
            placeholder="Ej: Invitaciones"
            className="w-full rounded border p-2 text-sm"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="rounded bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Agregar"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Categorías existentes</h2>
          <button
            type="button"
            onClick={loadCategories}
            disabled={fetching || saving}
            className="text-sm text-purple-600 hover:underline disabled:opacity-60"
          >
            Actualizar
          </button>
        </div>

        {fetching ? (
          <p className="text-sm text-gray-500">Cargando categorías...</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-gray-500">Todavía no hay categorías creadas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2 text-left">Nombre</th>
                  <th className="p-2 text-left">Productos usando esta categoría</th>
                  <th className="p-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-t">
                    <td className="p-2">
                      {editingId === category.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          className="w-full rounded border p-2"
                        />
                      ) : (
                        <span className="font-medium">{category.name}</span>
                      )}
                    </td>
                    <td className="p-2 text-gray-700">
                      {category.productsCount === 0
                        ? "Sin productos"
                        : `${category.productsCount} producto${category.productsCount === 1 ? "" : "s"}`}
                    </td>
                    <td className="p-2 text-right">
                      {editingId === category.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdate(category)}
                            disabled={saving}
                            className="rounded bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700 disabled:opacity-60"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            disabled={saving}
                            className="rounded bg-gray-200 px-3 py-1.5 text-xs text-gray-800 hover:bg-gray-300 disabled:opacity-60"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => startEditing(category)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(category)}
                            disabled={saving || category.productsCount > 0}
                            className={`text-xs ${
                              category.productsCount > 0
                                ? "text-gray-400"
                                : "text-red-600 hover:underline disabled:opacity-60"
                            }`}
                            title={
                              category.productsCount > 0
                                ? "No se puede eliminar una categoría usada por productos"
                                : "Eliminar categoría"
                            }
                          >
                            {deletingId === category.id ? "Eliminando..." : "Eliminar"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        <strong>Importante:</strong> una categoría solo se puede eliminar si no tiene productos asociados.
        Si necesitás quitar una categoría en uso, primero editá esos productos y cambialos a otra categoría.
      </div>
    </div>
  );
}