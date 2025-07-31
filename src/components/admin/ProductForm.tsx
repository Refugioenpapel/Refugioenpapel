// components/admin/ProductForm.tsx

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useRouter } from 'next/navigation';

type Variant = {
  name: string;
  price: number;
};

type BulkDiscount = {
  min: number;
  max: number | null;
  price: number;
};

type ProductFormProps = {
  existingProduct?: any;
};

export default function ProductForm({ existingProduct }: ProductFormProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [isPhysical, setIsPhysical] = useState(false);
  const [bulkDiscounts, setBulkDiscounts] = useState<BulkDiscount[]>([]);
  const [variantList, setVariantList] = useState<Variant[]>([ { name: 'Refugio Mini', price: 0 }, { name: 'Refugio Grande', price: 0 } ]);
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [imageFile, setImageFile] = useState<File[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name);
      setSlug(existingProduct.slug);
      setDescription(existingProduct.description);
      setPrice(existingProduct.price.toString());
      setDiscount(existingProduct.discount?.toString() || '');
      setIsPhysical(existingProduct.is_physical);
      setCategory(existingProduct.category);
      setVariantList(existingProduct.variants || []);
      setBulkDiscounts(existingProduct.bulk_discounts || []);
      setIsFeatured(existingProduct.is_featured);
    }
  }, [existingProduct]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categories').select('name');
      if (!error && data) {
        setCategories(data.map((cat) => cat.name));
      }
    };
    fetchCategories();
  }, []);

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

  const updateBulkDiscount = (index: number, field: keyof BulkDiscount, value: string) => {
    const updated = [...bulkDiscounts];
    const discount = updated[index];
    if (field === 'min' || field === 'price') discount[field] = Number(value);
    else if (field === 'max') discount.max = value === '' ? null : Number(value);
    setBulkDiscounts(updated);
  };

  const addBulkDiscount = () => setBulkDiscounts([...bulkDiscounts, { min: 0, max: null, price: 0 }]);
  const removeBulkDiscount = (index: number) => {
    const updated = [...bulkDiscounts];
    updated.splice(index, 1);
    setBulkDiscounts(updated);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const discountValue = Number(discount);
    if (discount && (discountValue < 0 || discountValue > 100)) {
      alert('El descuento debe estar entre 0 y 100');
      return;
    }

    let imageUrls: string[] = existingProduct?.images || [];

    for (const file of imageFile) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload-image', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('Error al subir imagen a Cloudinary:', data);
    return;
  }

  imageUrls.push(data.url);
}


    const productData = {
      name,
      slug,
      description,
      price: Number(price),
      discount: discount ? discountValue : null,
      category,
      variants: variantList,
      images: imageUrls,
      is_physical: isPhysical,
      bulk_discounts: isPhysical ? bulkDiscounts : null,
      is_featured: isFeatured
    };

    if (existingProduct) {
      const { error: updateError } = await supabase.from('products').update(productData).eq('id', existingProduct.id);
      if (updateError) {
        console.error('Error al actualizar producto:', updateError);
        return;
      }
      alert('Producto actualizado correctamente');
    } else {
      if (!imageFile.length) return alert('Selecciona al menos una imagen');
      const { error: insertError } = await supabase.from('products').insert([productData]);
      if (insertError) {
        console.error('Error al guardar el producto:', insertError);
        return;
      }
      alert('Producto agregado correctamente');
    }

    router.push('/admin');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">{existingProduct ? 'Editar producto' : 'Nuevo producto'}</h1>

      <input type="text" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} className="w-full border p-2 rounded" required />

      <input type="text" placeholder="Slug (url-amigable)" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full border p-2 rounded" required />

      <textarea placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border p-2 rounded" required />

      <input type="number" placeholder="Precio base" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border p-2 rounded" required />

      <input type="number" placeholder="Descuento (%)" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full border p-2 rounded" min="0" max="100" />

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={isPhysical} onChange={(e) => setIsPhysical(e.target.checked)} /> ¿Es un producto físico?
      </label>

      {isPhysical && (
        <div className="space-y-2">
          <label className="block font-medium">Descuentos por cantidad</label>
          {bulkDiscounts.map((discount, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input type="number" placeholder="Cantidad mínima" value={discount.min} onChange={(e) => updateBulkDiscount(index, 'min', e.target.value)} className="border p-2 rounded w-1/3" />
              <input type="number" placeholder="Cantidad máxima" value={discount.max ?? ''} onChange={(e) => updateBulkDiscount(index, 'max', e.target.value)} className="border p-2 rounded w-1/3" />
              <input type="number" placeholder="Precio unitario" value={discount.price} onChange={(e) => updateBulkDiscount(index, 'price', e.target.value)} className="border p-2 rounded w-1/3" />
              <button type="button" onClick={() => removeBulkDiscount(index)} className="text-red-500 font-bold text-xl">×</button>
            </div>
          ))}
          <button type="button" onClick={addBulkDiscount} className="text-sm text-purple-600 hover:underline">+ Agregar descuento por cantidad</button>
        </div>
      )}

      <div>
        <label className="block font-medium mb-1">Categoría</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border p-2 rounded" required>
          <option value="">Seleccioná una categoría</option>
          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>{cat}</option>
          ))}
        </select>
        {addingCategory ? (
          <div className="flex gap-2 mt-2">
            <input type="text" placeholder="Nueva categoría" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="border p-2 rounded w-full" />
            <button type="button" onClick={handleAddCategory} className="bg-green-600 text-white px-3 rounded">Agregar</button>
          </div>
        ) : (
          <button type="button" onClick={() => setAddingCategory(true)} className="mt-2 text-sm text-purple-600 hover:underline">+ Agregar categoría</button>
        )}
      </div>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> ¿Es un producto destacado?
      </label>

      <div className="space-y-2">
        <label className="block font-medium">Variantes</label>
        {variantList.map((variant, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input type="text" placeholder="Nombre de la variante" value={variant.name} onChange={(e) => updateVariant(index, 'name', e.target.value)} className="border p-2 rounded w-1/2" />
            <input type="number" placeholder="Precio extra" value={variant.price} onChange={(e) => updateVariant(index, 'price', e.target.value)} className="border p-2 rounded w-1/2" />
            <button type="button" onClick={() => removeVariant(index)} className="text-red-500 font-bold text-xl">×</button>
          </div>
        ))}
        <button type="button" onClick={addVariant} className="text-sm text-purple-600 hover:underline">+ Agregar variante</button>
      </div>

      <input type="file" accept="image/*" multiple onChange={(e) => setImageFile(e.target.files ? Array.from(e.target.files) : [])} className="w-full" />

      <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
        {existingProduct ? 'Actualizar producto' : 'Guardar producto'}
      </button>
    </form>
  );
}
