'use client';

import { useState } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ProductForm() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [variants, setVariants] = useState('[{"name":"Mini","price":0},{"name":"Grande","price":300}]');
  const [imageFile, setImageFile] = useState<File[]>([]);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile) {
      alert('Selecciona una imagen');
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
        console.error('Error uploading image:', uploadError);
        return;
      }

      const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/productos/${filePath}`;
      imageUrls.push(imageUrl);
    }

    // Insertar producto en la base de datos
    const { error: insertError } = await supabase.from('products').insert([
      {
        name,
        slug,
        description,
        price: Number(price),
        category,
        variants: JSON.parse(variants),
        images: imageUrls,
      },
    ]);

    if (insertError) {
      console.error('Error inserting product:', insertError);
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
        placeholder="Precio"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />

      <input
        type="text"
        placeholder="Categoría"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />

      <textarea
        placeholder='Variantes (ej: [{"name":"Mini","price":0},{"name":"Grande","price":300}])'
        value={variants}
        onChange={(e) => setVariants(e.target.value)}
        className="w-full border p-2 rounded font-mono text-sm"
        required
      />

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setImageFile(e.target.files ? Array.from(e.target.files) : [])}
        className="w-full"
        required
      />

      <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
        Guardar producto
      </button>
    </form>
  );
}
