'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@lib/supabaseClient';
import ProductForm from '@components/admin/ProductForm';

export default function EditarProductoPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function fetchProduct() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) setProduct(data);
    }

    fetchProduct();
  }, [id]);

  return (
    <div className="p-4">
      {product ? (
        <ProductForm existingProduct={product} />
      ) : (
        <p>Cargando producto...</p>
      )}
    </div>
  );
}
