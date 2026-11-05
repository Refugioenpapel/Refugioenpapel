// components/admin/ProductList.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useRouter } from 'next/navigation';

type Product = {
  id: number;
  name: string;
  slug: string;
  price?: number | null;
  discount?: number | null;
  images: string[] | null;            // URLs legacy
  image_public_ids?: string[] | null; // NUEVO (si ya existe en BD)
};

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [priceDrafts, setPriceDrafts] = useState<Record<number, string>>({});
  const [savingPrices, setSavingPrices] = useState(false);
  const [priceMessage, setPriceMessage] = useState('');
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id,name,slug,price,discount,images,image_public_ids')
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

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return products.filter((product) =>
      !query || product.name.toLocaleLowerCase().includes(query) || product.slug.toLocaleLowerCase().includes(query)
    );
  }, [products, search]);

  const changedPrices = products.filter((product) => {
    const draft = priceDrafts[product.id];
    return draft !== undefined && draft.trim() !== '' && Number(draft) !== Number(product.price ?? 0);
  });

  const savePrices = async () => {
    if (!changedPrices.length || savingPrices) return;
    const invalid = changedPrices.find((product) => !Number.isFinite(Number(priceDrafts[product.id])) || Number(priceDrafts[product.id]) < 0);
    if (invalid) {
      setPriceMessage(`Revisá el precio de ${invalid.name}: ingresá un número igual o mayor a cero.`);
      return;
    }
    setSavingPrices(true);
    setPriceMessage('');
    const results = await Promise.all(changedPrices.map(async (product) => {
      const { error } = await supabase.from('products').update({ price: Number(priceDrafts[product.id]) }).eq('id', product.id);
      return { product, error };
    }));
    const failed = results.filter((result) => result.error);
    const savedIds = new Set(results.filter((result) => !result.error).map((result) => result.product.id));
    setProducts((current) => current.map((product) => savedIds.has(product.id)
      ? { ...product, price: Number(priceDrafts[product.id]) }
      : product));
    setPriceDrafts((current) => {
      const next = { ...current };
      savedIds.forEach((id) => delete next[id]);
      return next;
    });
    setPriceMessage(failed.length
      ? `Se guardaron ${savedIds.size}; no se pudieron guardar ${failed.length}. Revisá los permisos o la conexión e intentá de nuevo.`
      : `Precios actualizados correctamente (${savedIds.size}).`);
    if (failed.length) console.error('Error al actualizar precios:', failed);
    setSavingPrices(false);
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Productos y precios</h2>
          <p className="text-sm text-gray-500">Editá varios precios y guardalos juntos. Los descuentos y variantes no se modifican.</p>
        </div>
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
        <>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row">
          <input aria-label="Buscar productos" placeholder="Buscar por nombre o slug…" value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-10 flex-1 rounded border border-gray-300 bg-white px-3" />
          <button onClick={savePrices} disabled={!changedPrices.length || savingPrices} className="min-h-10 rounded bg-purple-600 px-4 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50">
            {savingPrices ? 'Guardando…' : `Guardar cambios${changedPrices.length ? ` (${changedPrices.length})` : ''}`}
          </button>
        </div>
        {priceMessage && <p role="status" className="mb-3 text-sm text-gray-700">{priceMessage}</p>}
        <div className="overflow-x-auto rounded border bg-white">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-pink-50 text-gray-700"><tr><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Precio</th><th className="px-4 py-3">Descuento</th><th className="px-4 py-3">Acciones</th></tr></thead>
            <tbody className="divide-y">
          {filteredProducts.map((product) => {
            const isDeleting = deletingId === product.id;
            return (
              <tr
                key={product.id}
                className="align-middle"
              >
                <td className="px-4 py-3"><p className="font-semibold">{product.name}</p><p className="text-xs text-gray-500">{product.slug}</p></td>
                <td className="px-4 py-3"><label className="sr-only" htmlFor={`price-${product.id}`}>Precio de {product.name}</label><input id={`price-${product.id}`} type="number" min="0" step="0.01" value={priceDrafts[product.id] ?? String(product.price ?? 0)} onChange={(event) => { setPriceDrafts((current) => ({ ...current, [product.id]: event.target.value })); setPriceMessage(''); }} className="w-36 rounded border border-gray-300 px-3 py-2" /></td>
                <td className="px-4 py-3">{product.discount ? `${product.discount}% OFF` : '—'}</td>
                <td className="px-4 py-3"><div className="flex gap-3">
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
                </div></td>
              </tr>
            );
          })}
            {filteredProducts.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No se encontraron productos.</td></tr>}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
