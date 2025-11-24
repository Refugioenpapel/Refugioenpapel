"use client";

import { useEffect, useState } from "react";
import {
  fetchAllSlides,
  insertSlide,
  updateSlide,
  deleteSlide,
  HeroSlide,
} from "lib/supabase/heroSlides";

import { X } from "lucide-react";
import { uploadImageToCloudinary } from "lib/cloudinary/uploadImage";

export default function BannersAdminPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [openModal, setOpenModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    button_label: "",
    button_url: "",
    image_url: "",
    sort_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    setEditingSlide(null);
    setForm({
      title: "",
      subtitle: "",
      button_label: "",
      button_url: "",
      image_url: "",
      sort_order: 0,
      is_active: true,
    });
  };

  async function load() {
    setLoading(true);
    try {
      const allSlides = await fetchAllSlides(); // <- sin .data
      setSlides(allSlides || []);
    } catch (err) {
      console.error("Error cargando banners:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const openNewBannerModal = () => {
    resetForm();
    setOpenModal(true);
  };

  const openEditModal = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setForm({
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      button_label: slide.button_label || "",
      button_url: slide.button_url || "",
      image_url: slide.image_url || "",
      sort_order: slide.sort_order || 0,
      is_active: !!slide.is_active,
    });
    setOpenModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar banner definitivamente?")) return;
    await deleteSlide(id);
    load();
  };

  const handleImageUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploaded = await uploadImageToCloudinary(file, "banners");
      setForm((f) => ({
        ...f,
        image_url: uploaded.url,
      }));
    } catch (err) {
      console.error(err);
      alert("Error subiendo la imagen.");
    }
  };

  const handleSubmit = async () => {
    if (!form.image_url) {
      alert("La imagen es obligatoria.");
      return;
    }

    if (editingSlide) {
      await updateSlide(editingSlide.id, form);
    } else {
      await insertSlide(form);
    }

    setOpenModal(false);
    await load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Banners</h1>

        <button
          onClick={openNewBannerModal}
          className="px-4 py-2 rounded-md bg-[#c7a1d9] text-white font-medium"
        >
          Nuevo Banner
        </button>
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Orden</th>
              <th className="p-2 text-left">Imagen</th>
              <th className="p-2 text-left">Título</th>
              <th className="p-2 text-left">Activo</th>
              <th className="p-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {slides.map((slide) => (
              <tr key={slide.id} className="border-t">
                <td className="p-2">{slide.sort_order}</td>

                <td className="p-2">
                  <img
                    src={slide.image_url}
                    className="w-32 h-20 rounded object-cover"
                  />
                </td>

                <td className="p-2">{slide.title || "-"}</td>

                <td className="p-2">{slide.is_active ? "Sí" : "No"}</td>

                <td className="p-2 text-right space-x-3">
                  <button
                    onClick={() => openEditModal(slide)}
                    className="text-blue-600 text-xs"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(slide.id)}
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

      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-lg p-6 rounded-lg shadow-xl relative animate-fade-in">
            <button
              onClick={() => setOpenModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X />
            </button>

            <h2 className="text-xl font-semibold mb-4">
              {editingSlide ? "Editar Banner" : "Nuevo Banner"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="font-medium block mb-1">Imagen *</label>
                <input type="file" onChange={handleImageUpload} />
                {form.image_url && (
                  <img
                    src={form.image_url}
                    className="w-full h-40 object-cover rounded mt-2"
                  />
                )}
              </div>

              <input
                className="border p-2 rounded w-full"
                placeholder="Título (opcional)"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
              />

              <input
                className="border p-2 rounded w-full"
                placeholder="Subtítulo (opcional)"
                value={form.subtitle}
                onChange={(e) =>
                  setForm({ ...form, subtitle: e.target.value })
                }
              />

              <input
                className="border p-2 rounded w-full"
                placeholder="Texto botón (opcional)"
                value={form.button_label}
                onChange={(e) =>
                  setForm({ ...form, button_label: e.target.value })
                }
              />

              <input
                className="border p-2 rounded w-full"
                placeholder="URL del botón (opcional)"
                value={form.button_url}
                onChange={(e) =>
                  setForm({ ...form, button_url: e.target.value })
                }
              />

              <input
                className="border p-2 rounded w-full"
                type="number"
                placeholder="Orden"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
              />

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                />
                Activo
              </label>

              <button
                onClick={handleSubmit}
                className="w-full bg-[#ffabcc] text-white py-2 rounded-md mt-3"
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
