'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useRouter } from 'next/navigation';

type Variant = {
  name: string;
  price: number;
};

export default function ProductForm() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [variantList, setVariantList] = useState<Variant[]>([
    { name: 'Mini', price: 0 },
    { name: 'Grande', price: 0 },
  ]);
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [imageFile, setImageFile] = useState<File[]>([]);
  const router = useRouter();

  // Cargar categorías existentes desde Supabase
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categories').select('name');
      if (error) {
        console.error('Error al cargar categorías:', error);
      } else if (data) {
        setCategories(data.map((cat) => cat.name));
      }
    };
    fetchCategories();
  }, []);

  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    const updated = [...variantList];
    if (field === 'price') {
      updated[index][field] = Number(value);
    } else {
      updated[index][field] = value;
    }
    setVariantList(updated);
  };

  const addVariant = () => {
    setVariantList([...variantList, { name: '', price: 0 }]);
  };

  const removeVariant = (index: number) => {
    const updated = [...variantList];
    updated.splice(index, 1);
    setVariantList(updated);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const { error } = await supabase.from('categories').insert([{ name: newCategoryName.trim() }]);
    if (error) {
      alert('Error al agregar categoría: ' + error.message);
      return;
    }
    setCategories([...categories, newCategoryName.trim()]);
    setCategory(newCategoryName.trim());
    setNewCategoryName('');
    setAddingCategory(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile.length) {
      alert('Selecciona al menos una imagen');
      return;
    }

    // Subir imágenes a Supabase Storage
    let imageUrls: string[] = [];

    for (const file of imageFile) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('productos')
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        console.error('Error al subir la imagen:', uploadError);
        return;
      }

      const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/productos/${filePath}`;
      imageUrls.push(imageUrl);
    }

    // Insertar producto en Supabase
    const { error: insertError } = await supabase.from('products').insert([
      {
        name,
        slug,
        description,
        price: Number(price),
        category,
        variants: variantList,
        images: imageUrls,
      },
    ]);

    if (insertError) {
      console.error('Error al guardar el producto:', insertError);
      return;
    }

    alert('Producto agregado correctamente');
    router.push('/admin');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Nuevo producto</h1>

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

      <div>
        <label className="block font-medium mb-1">Categoría</label>
        <div className="flex gap-2 items-center">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Seleccioná una categoría</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {addingCategory ? (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="Nueva categoría"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="border p-2 rounded w-full"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="bg-green-600 text-white px-3 rounded"
            >
              Agregar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingCategory(true)}
            className="mt-2 text-sm text-purple-600 hover:underline"
          >
            + Agregar categoría
          </button>
        )}
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
        <button
          type="button"
          onClick={addVariant}
          className="text-sm text-purple-600 hover:underline"
        >
          + Agregar variante
        </button>
      </div>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setImageFile(e.target.files ? Array.from(e.target.files) : [])}
        className="w-full"
        required
      />

      <button
        type="submit"
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
      >
        Guardar producto
      </button>
    </form>
  );
}
