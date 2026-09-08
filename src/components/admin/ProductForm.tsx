// components/admin/ProductForm.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { uploadImageToCloudinary } from '@lib/cloudinary/uploadImage';


type Variant = { name: string; price: number };

type ImageItem = {
  id: string;
  url: string;
  publicId?: string;
  file?: File;
  existing: boolean;
};

type ProductFormProps = {
  existingProduct?: any;
};

export default function ProductForm({ existingProduct }: ProductFormProps) {
  // Básicos
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPct, setDiscountPct] = useState('');

  // Flags
  const [isPhysical, setIsPhysical] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  // Nuevo esquema: umbral + %
  const [bulkThresholdQty, setBulkThresholdQty] = useState<string>(''); // ej. "25"
  const [bulkDiscountPct, setBulkDiscountPct] = useState<string>('');   // ej. "10"

  // Variantes
  const [variantList, setVariantList] = useState<Variant[]>([
    { name: 'Refugio Mini', price: 0 },
    { name: 'Refugio Grande', price: 0 },
  ]);

  // Categorías
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [badgeLabel, setBadgeLabel] = useState('');

  // Imágenes
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [deletedPublicIds, setDeletedPublicIds] = useState<string[]>([]);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  const router = useRouter();

  // Prefill si hay producto existente
  useEffect(() => {
    if (!existingProduct) return;

    setName(existingProduct.name ?? '');
    setSlug(existingProduct.slug ?? '');
    setDescription(existingProduct.description ?? '');
    setPrice(existingProduct.price?.toString() ?? '');
    setDiscountPct(existingProduct.discount != null ? String(existingProduct.discount) : '');
    setIsPhysical(!!existingProduct.is_physical);
    setCategory(existingProduct.category ?? '');
    setBadgeLabel(existingProduct.badge_label ?? '');
    setIsFeatured(!!existingProduct.is_featured);

    // Variantes (tolerante a {label,price} o {name,price})
    if (Array.isArray(existingProduct.variants)) {
      const mapped: Variant[] = existingProduct.variants.map((v: any) => ({
        name: typeof v?.name === 'string' ? v.name : (v?.label ?? ''),
        price: Number(v?.price ?? 0),
      }));
      setVariantList(mapped);
    }

    // Campos nuevos
    if (existingProduct.bulk_threshold_qty != null) {
      setBulkThresholdQty(String(existingProduct.bulk_threshold_qty));
    }
    if (existingProduct.bulk_discount_pct != null) {
      setBulkDiscountPct(String(existingProduct.bulk_discount_pct));
    }

    // Legacy helper: si sólo había bandas, sugerimos el min del primer tramo
    if (
      !existingProduct.bulk_threshold_qty &&
      Array.isArray(existingProduct.bulk_discounts) &&
      existingProduct.bulk_discounts.length > 0
    ) {
      const first = existingProduct.bulk_discounts[0]; // { min, max, price }
      if (first?.min != null) setBulkThresholdQty(String(first.min));
    }

    // Imágenes existentes
    if (Array.isArray(existingProduct.images)) {
      const existingIds = Array.isArray(existingProduct.image_public_ids)
        ? existingProduct.image_public_ids
        : [];
      setImageItems(
        existingProduct.images.map((url: string, index: number) => ({
          id: `existing-${index}-${url}`,
          url,
          publicId: existingIds[index] ?? undefined,
          existing: true,
        }))
      );
    }
  }, [existingProduct]);

  // Cargar categorías
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categories').select('name');
      if (!error && data) setCategories(data.map((c) => c.name));
    };
    fetchCategories();
  }, []);

  // Variantes handlers
  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    const updated = [...variantList];
    const variant = updated[index];
    if (field === 'price') variant.price = Number(value);
    else if (field === 'name') variant.name = value;
    setVariantList(updated);
  };

  const addImageItems = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems = Array.from(files).map((file) => ({
      id: `new-${file.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      url: URL.createObjectURL(file),
      file,
      existing: false,
    }));
    setImageItems((prev) => [...prev, ...newItems]);
  };

  const removeImageItem = (id: string) => {
    setImageItems((prev) => {
      const removed = prev.find((item) => item.id === id);
      if (removed?.file) {
        URL.revokeObjectURL(removed.url);
      }
      return prev.filter((item) => item.id !== id);
    });
    const removed = imageItems.find((item) => item.id === id);
    if (removed?.publicId) {
      setDeletedPublicIds((prev) => [...prev, removed.publicId!]);
    }
  };

  const moveImageItem = (index: number, direction: 'left' | 'right') => {
    setImageItems((prev) => {
      const nextIndex = direction === 'left' ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      return copy;
    });
  };

  const handleReplaceFile = (file: File | null) => {
    if (!file || !replaceTargetId) return;
    setImageItems((prev) =>
      prev.map((item) => {
        if (item.id !== replaceTargetId) return item;
        if (item.file) {
          URL.revokeObjectURL(item.url);
        }
        return {
          ...item,
          id: `new-${file.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          url: URL.createObjectURL(file),
          file,
          existing: false,
          publicId: undefined,
        };
      })
    );
    setReplaceTargetId(null);
  };

  const triggerReplace = (id: string) => {
    setReplaceTargetId(id);
    replaceInputRef.current?.click();
  };
  const addVariant = () => setVariantList([...variantList, { name: '', price: 0 }]);
  const removeVariant = (index: number) => {
    const updated = [...variantList];
    updated.splice(index, 1);
    setVariantList(updated);
  };

  // Categorías handler
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const { error } = await supabase.from('categories').insert([{ name: newCategoryName.trim() }]);
    if (!error) {
      setCategories([...categories, newCategoryName.trim()]);
      setCategory(newCategoryName.trim());
      setNewCategoryName('');
      setAddingCategory(false);
    }
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones nuevo esquema
    const thresholdNum = bulkThresholdQty === '' ? null : Number(bulkThresholdQty);
    const bulkPctNum = bulkDiscountPct === '' ? null : Number(bulkDiscountPct);
    const promoPctNum = discountPct === '' ? null : Number(discountPct);

    if (promoPctNum != null && (isNaN(promoPctNum) || promoPctNum < 0 || promoPctNum > 95)) {
      alert('El descuento promocional del producto debe estar entre 0 y 95%.');
      return;
    }

    if (isPhysical && (thresholdNum != null || bulkPctNum != null)) {
      if (thresholdNum == null || isNaN(thresholdNum) || thresholdNum < 2) {
        alert('Indicá una cantidad mínima válida (ej. 20, 25).');
        return;
      }
      if (bulkPctNum == null || isNaN(bulkPctNum) || bulkPctNum <= 0 || bulkPctNum > 90) {
        alert('El % de descuento por cantidad debe ser >0 y ≤90.');
        return;
      }
    }

    // Subida de imágenes: guardamos URL + public_id
    let imageUrls: string[] = [];
    let publicIds: string[] = [];

    try {
      const newItems = imageItems.filter((item) => !item.existing && item.file);
      const uploadedMap = new Map<string, { url: string; public_id: string }>();

      for (const item of newItems) {
        const uploaded = await uploadImageToCloudinary(item.file!, "productos");
        uploadedMap.set(item.id, uploaded);
      }

      imageUrls = imageItems.map((item) =>
        item.existing
          ? item.url
          : uploadedMap.get(item.id)?.url ?? item.url
      );

      publicIds = imageItems
        .map((item) =>
          item.existing
            ? item.publicId
            : uploadedMap.get(item.id)?.public_id
        )
        .filter((id): id is string => Boolean(id));
    } catch (err: any) {
      console.error("Error al subir imagen a Cloudinary:", err);
      alert(err?.message || "Error al subir imagen. Revisá la consola.");
      return;
    }

    // Payload para BD
    const productData: any = {
      name,
      slug,
      description,
      price: Number(price),
      discount: promoPctNum && promoPctNum > 0 ? promoPctNum : null,
      category,
      badge_label: badgeLabel.trim() || null,
      variants: variantList,
      images: imageUrls,
      image_public_ids: publicIds,
      is_physical: isPhysical,
      bulk_discounts: null,
      bulk_threshold_qty: isPhysical ? thresholdNum : null,
      bulk_discount_pct: isPhysical ? bulkPctNum : null,
      is_featured: isFeatured,
    };

    if (existingProduct) {
      const { error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', existingProduct.id);

      if (updateError) {
        console.error('Error al actualizar producto:', updateError);
        alert('No se pudo actualizar. Revisá la consola.');
        return;
      }

      if (deletedPublicIds.length > 0) {
        try {
          const deleteRes = await fetch('/api/cloudinary/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicIds: deletedPublicIds }),
          });
          const deleteJson = await deleteRes.json();
          if (!deleteRes.ok) {
            console.warn('No se pudieron borrar algunas imágenes de Cloudinary:', deleteJson);
          }
        } catch (deleteErr) {
          console.warn('Error al borrar imágenes en Cloudinary:', deleteErr);
        }
      }

      alert('Producto actualizado correctamente');
    } else {
      if (imageItems.length === 0) return alert('Seleccioná al menos una imagen');

      const { error: insertError } = await supabase.from('products').insert([productData]);
      if (insertError) {
        console.error('Error al guardar el producto:', insertError);
        alert('No se pudo guardar. Revisá la consola.');
        return;
      }
      alert('Producto agregado correctamente');
    }

    router.push('/admin');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">{existingProduct ? 'Editar producto' : 'Nuevo producto'}</h1>

      <input
        type="text"
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />

      <input
        type="text"
        placeholder="Slug (url-amigable)"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />

      <textarea
        placeholder="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />

      <input
        type="number"
        placeholder="Precio base"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />

      <div className="rounded-xl border border-pink-100 bg-pink-50/50 p-3 space-y-2">
        <label className="block font-medium text-gray-800">Promoción del producto (%)</label>
        <input
          type="number"
          min={0}
          max={95}
          step="0.01"
          placeholder="Ej: 10 para mostrar 10% OFF"
          value={discountPct}
          onChange={(e) => setDiscountPct(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <p className="text-sm text-gray-600">
          Es un descuento individual del producto. Se aplica primero, antes de cupones y antes del descuento por cantidad.
        </p>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isPhysical}
          onChange={(e) => setIsPhysical(e.target.checked)}
        />
        ¿Es un producto físico?
      </label>

      {/* Nuevo esquema: Umbral + % */}
      {isPhysical && (
        <div className="space-y-2">
          <label className="block font-medium">Descuento por cantidad (nuevo esquema)</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={2}
              step={1}
              placeholder="Cantidad mínima (ej. 25)"
              value={bulkThresholdQty}
              onChange={(e) => setBulkThresholdQty(e.target.value)}
              className="border p-2 rounded w-1/2"
            />
            <input
              type="number"
              min={0}
              max={90}
              step="0.01"
              placeholder="Descuento % (ej. 10)"
              value={bulkDiscountPct}
              onChange={(e) => setBulkDiscountPct(e.target.value)}
              className="border p-2 rounded w-1/2"
            />
          </div>
          <p className="text-sm text-gray-600">
            Se aplicará <strong>{bulkDiscountPct || '…'}%</strong> cuando el cliente compre{' '}
            <strong>≥ {bulkThresholdQty || '…'}</strong> unidades del mismo producto.
          </p>
        </div>
      )}

      {/* Categoría */}
      <div>
        <label className="block font-medium mb-1">Mensaje del badge (opcional)</label>
        <input
          type="text"
          placeholder="Ej: 10% OFF comprando desde 20 u."
          value={badgeLabel}
          onChange={(e) => setBadgeLabel(e.target.value)}
          className="w-full border p-2 rounded mb-3"
        />

        <label className="block font-medium mb-1">Categoría</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border p-2 rounded"
          required
        >
          <option value="">Seleccioná una categoría</option>
          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>{cat}</option>
          ))}
        </select>

        {addingCategory ? (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="Nueva categoría"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="border p-2 rounded w-full"
            />
            <button type="button" onClick={handleAddCategory} className="bg-green-600 text-white px-3 rounded">
              Agregar
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setAddingCategory(true)} className="mt-2 text-sm text-purple-600 hover:underline">
            + Agregar categoría
          </button>
        )}
      </div>

      {/* Destacado */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
        />
        ¿Es un producto destacado?
      </label>

      {/* Variantes */}
      <div className="space-y-2">
        <label className="block font-medium">Imágenes</label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {imageItems.map((item, index) => (
            <div key={item.id} className="border rounded-xl p-2 bg-white shadow-sm">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-50">
                <img src={item.url} alt={`Imagen ${index + 1}`} className="object-cover w-full h-full" />
              </div>
              <div className="mt-2 space-y-2 text-xs text-gray-700">
                <p className="font-medium">Orden {index + 1}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => moveImageItem(index, 'left')}
                    disabled={index === 0}
                    className="rounded-full border px-2 py-1 text-[0.7rem] font-semibold disabled:opacity-50"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImageItem(index, 'right')}
                    disabled={index === imageItems.length - 1}
                    className="rounded-full border px-2 py-1 text-[0.7rem] font-semibold disabled:opacity-50"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerReplace(item.id)}
                    className="rounded-full border px-2 py-1 text-[0.7rem] font-semibold"
                  >
                    Reemplazar
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImageItem(item.id)}
                    className="rounded-full border border-red-400 text-red-600 px-2 py-1 text-[0.7rem] font-semibold"
                  >
                    Eliminar
                  </button>
                </div>
                <p className="text-[0.7rem] text-gray-500">
                  {item.existing ? 'Imagen cargada' : 'Imagen nueva'}
                </p>
              </div>
            </div>
          ))}
        </div>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => addImageItems(e.target.files)}
          className="w-full"
        />
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={replaceInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            handleReplaceFile(file);
            e.target.value = '';
          }}
        />
      </div>

      <div className="space-y-2">
        <label className="block font-medium">Variantes</label>
        {variantList.map((variant, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Nombre de la variante"
              value={variant.name}
              onChange={(e) => updateVariant(index, 'name', e.target.value)}
              className="border p-2 rounded w-1/2"
            />
            <input
              type="number"
              placeholder="Precio extra"
              value={variant.price}
              onChange={(e) => updateVariant(index, 'price', e.target.value)}
              className="border p-2 rounded w-1/2"
            />
            <button
              type="button"
              onClick={() => removeVariant(index)}
              className="text-red-500 font-bold text-xl"
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" onClick={addVariant} className="text-sm text-purple-600 hover:underline">
          + Agregar variante
        </button>
      </div>

      {/* Imágenes */}
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => addImageItems(e.target.files)}
        className="w-full"
      />

      <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
        {existingProduct ? 'Actualizar producto' : 'Guardar producto'}
      </button>
    </form>
  );
}
