'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@lib/supabaseClient';

interface Product {
  id: number;
  name: string;
  slug: string;
  images: string[];
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false });
    if (!error && data) setProducts(data);
    setLoading(false);
  };

  const handleDelete = async (product: Product) => {
    const confirm = window.confirm(`¿Eliminar "${product.name}" y su imagen?`);
    if (!confirm) return;

    const imagePath = product.images?.[0]?.split('/').pop();
    if (imagePath) {
      await supabase.storage.from('productos').remove([imagePath]);
    }

    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) {
      console.error('Error al eliminar producto:', error);
      return;
    }

    fetchProducts();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Productos existentes</h2>
      {loading ? (
        <p>Cargando productos...</p>
      ) : (
        <ul className="space-y-4">
          {products.map((product) => (
            <li key={product.id} className="border p-4 rounded shadow flex justify-between items-center">
              <div>
                <p className="font-bold">{product.name}</p>
                <p className="text-sm text-gray-500">{product.slug}</p>
              </div>
              <button onClick={() => handleDelete(product)} className="text-red-600 hover:underline">Eliminar</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
