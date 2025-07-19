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

    // Eliminar todas las imágenes asociadas al producto
    if (product.images?.length > 0) {
      const imagePaths = product.images.map((url) => {
        const parts = url.split('/');
        return parts.slice(parts.indexOf('productos') + 1).join('/');
      });

      const { error: storageError } = await supabase
        .storage
        .from('productos')
        .remove(imagePaths);

      if (storageError) {
        console.error('Error al eliminar imágenes del storage:', storageError);
      }
    }

    // Eliminar el producto de la tabla
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
