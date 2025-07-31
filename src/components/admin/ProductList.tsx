// components/admin/ProductList.tsx

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  slug: string;
  images: string[];
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: false });

    if (!error && data) setProducts(data);
    setLoading(false);
  };

  const handleDelete = async (product: Product) => {
    const confirm = window.confirm(`¿Eliminar "${product.name}" y todas sus imágenes?`);
    if (!confirm) return;

    // Paso 1: Eliminar imágenes de Cloudinary si existen
    if (product.images?.length > 0) {
      const cloudName = 'dr5kd2z7y';

      // Extraer los public_id de cada URL de Cloudinary
      const publicIds = product.images
        .map((url) => {
          const match = url.match(/\/v\d+\/(.+?)\.(jpg|png|jpeg|webp)/);
          return match ? match[1] : null;
        })
        .filter((id): id is string => id !== null);

      if (publicIds.length > 0) {
        try {
          const res = await fetch('/api/cloudinary/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicIds }),
          });

          if (!res.ok) {
            console.error('Error eliminando imágenes de Cloudinary');
          }
        } catch (err) {
          console.error('Error llamando a API de Cloudinary:', err);
        }
      }
    }

    // Paso 2: Eliminar el producto de la base de datos
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);

    if (error) {
      console.error('Error al eliminar producto:', error);
      return;
    }

    fetchProducts();
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/editar/${id}`);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Productos existentes</h2>
      {loading ? (
        <p>Cargando productos...</p>
      ) : (
        <ul className="space-y-4">
          {products.map((product) => (
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
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(product)}
                  className="text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
