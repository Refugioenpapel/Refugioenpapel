// components/admin/ProductForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useRouter } from 'next/navigation';

type Variant = { name: string; price: number };

type ProductFormProps = {
  existingProduct?: any;
};

export default function ProductForm({ existingProduct }: ProductFormProps) {
  // Básicos
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

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

  // Imágenes
  const [imageFile, setImageFile] = useState<File[]>([]);
  const [imagePublicIds, setImagePublicIds] = useState<string[]>(
    existingProduct?.image_public_ids || []
  );

  const router = useRouter();

  // Prefill si hay producto existente
  useEffect(() => {
    if (!existingProduct) return;

    setName(existingProduct.name ?? '');
    setSlug(existingProduct.slug ?? '');
    setDescription(existingProduct.description ?? '');
    setPrice(existingProduct.price?.toString() ?? '');
    setIsPhysical(!!existingProduct.is_physical);
    setCategory(existingProduct.category ?? '');
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

    // Public IDs si ya existían
    if (Array.isArray(existingProduct.image_public_ids)) {
      setImagePublicIds(existingProduct.image_public_ids);
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
    let imageUrls: string[] = existingProduct?.images || [];
    let publicIds: string[] = existingProduct?.image_public_ids || [];

    for (const file of imageFile) {
      const formData = new FormData();
      formData.append('file', file);
      // opcional: formData.append('folder', 'refugio/products');

      const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        console.error('Error al subir imagen a Cloudinary:', data);
        alert('Error al subir imagen. Revisá la consola.');
        return;
      }
      if (data?.url) imageUrls.push(data.url);
      if (data?.public_id) publicIds.push(data.public_id);
    }

    // Payload para BD (descuento general deprecado -> siempre null)
    const productData: any = {
      name,
      slug,
      description,
      price: Number(price),
      discount: null,                     // 👈 deprecado: no usar descuento general
      category,
      variants: variantList,              // {name, price}
      images: imageUrls,
      image_public_ids: publicIds,        // 👈 NUEVO
      is_physical: isPhysical,
      bulk_discounts: null,               // legacy ya no se usa
      bulk_threshold_qty: isPhysical ? thresholdNum : null,
      bulk_discount_pct:  isPhysical ? bulkPctNum : null,
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
      alert('Producto actualizado correctamente');
    } else {
      if (!imageFile.length) return alert('Seleccioná al menos una imagen');

      const { error: insertError } = await supabase.from('products').insert([productData]);
      if (insertError) {
        console.error('Error al guardar el producto:', insertError);
        alert('No se pudo guardar. Revisá la consola.');
        return;
      }
      alert('Producto agregado correctamente');
    }

    // Mantener estado coherente (opcional)
    setImagePublicIds(publicIds);

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
        onChange={(e) => setImageFile(e.target.files ? Array.from(e.target.files) : [])}
        className="w-full"
      />

      <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
        {existingProduct ? 'Actualizar producto' : 'Guardar producto'}
      </button>
    </form>
  );
}
