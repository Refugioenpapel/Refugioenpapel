// components/admin/ProductList.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useRouter } from 'next/navigation';

type Product = {
  id: number;
  name: string;
  slug: string;
  images: string[] | null;            // URLs legacy
  image_public_ids?: string[] | null; // NUEVO (si ya existe en BD)
};

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id,name,slug,images,image_public_ids')
      .order('id', { ascending: false });

    if (error) {
      console.error('Error al cargar productos:', error);
      setProducts([]);
    } else {
      setProducts((data || []) as Product[]);
    }
    setLoading(false);
  };

  // Fallback robusto: extrae public_id desde una URL de Cloudinary
  const extractPublicIdFromUrl = (url: string): string | null => {
    try {
      // Soporta transformaciones y versión:
      // https://res.cloudinary.com/<cloud>/image/upload/c_scale,w_800/v1729/folder/file_123.webp
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean);
      const vIdx = parts.findIndex((p) => /^v\d+$/i.test(p));
      const uploadIdx = parts.findIndex((p) => p === 'upload');
      const start = vIdx >= 0 ? vIdx + 1 : (uploadIdx >= 0 ? uploadIdx + 1 : 0);
      const after = parts.slice(start).join('/'); // folder/file.ext
      const dot = after.lastIndexOf('.');
      return dot === -1 ? after : after.slice(0, dot);
    } catch {
      return null;
    }
  };

  const handleDelete = async (product: Product) => {
    const ok = window.confirm(`¿Eliminar "${product.name}" y todas sus imágenes?`);
    if (!ok) return;

    setDeletingId(product.id);

    // 1) Determinar publicIds (preferimos columna nueva; si no existe, extraemos de URLs)
    let publicIds: string[] = [];
    if (product.image_public_ids && product.image_public_ids.length > 0) {
      publicIds = product.image_public_ids.filter(Boolean) as string[];
    } else if (Array.isArray(product.images)) {
      publicIds = product.images
        .map((url) => extractPublicIdFromUrl(url))
        .filter((id): id is string => !!id);
    }

    // 2) Intentar borrar en Cloudinary (si tenemos IDs)
    let cloudinaryOk = true;
    if (publicIds.length > 0) {
      try {
        const res = await fetch('/api/cloudinary/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicIds }),
        });
        if (!res.ok) {
          cloudinaryOk = false;
          const detail = await res.json().catch(() => ({}));
          console.error('Error eliminando imágenes de Cloudinary:', detail);
        }
      } catch (err) {
        cloudinaryOk = false;
        console.error('Error llamando a /api/cloudinary/delete:', err);
      }
    }

    // 3) Borrar registro en BD (si preferís soft-delete, cambiá por update deleted_at)
    const { error: dbErr } = await supabase.from('products').delete().eq('id', product.id);

    setDeletingId(null);

    if (dbErr) {
      alert('No se pudo eliminar el producto en la base de datos. Revisá la consola.');
      console.error('Error al eliminar producto:', dbErr);
      return;
    }

    if (!cloudinaryOk) {
      alert('Producto eliminado. Atención: algunas imágenes no se pudieron borrar de Cloudinary.');
    }

    fetchProducts();
  };

  const handleEdit = (id: number) => router.push(`/admin/editar/${id}`);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Productos existentes</h2>
        <button
          onClick={() => router.push('/admin/nuevo-producto')}
          className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700"
        >
          Agregar producto
        </button>
      </div>

      {loading ? (
        <p>Cargando productos...</p>
      ) : products.length === 0 ? (
        <p>No hay productos cargados.</p>
      ) : (
        <ul className="space-y-4">
          {products.map((product) => {
            const isDeleting = deletingId === product.id;
            return (
              <li
                key={product.id}
                className="border p-4 rounded shadow flex justify-between items-center"
              >
                <div>
                  <p className="font-bold">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.slug}</p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleEdit(product.id)}
                    className="text-blue-600 hover:underline disabled:opacity-50"
                    disabled={isDeleting}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="text-red-600 hover:underline disabled:opacity-50"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Eliminando…' : 'Eliminar'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
