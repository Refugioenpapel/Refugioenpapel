// lib/supabase/deleteProductWithImages.ts
import { createClient } from '@supabase/supabase-js';
import cloudinary from '../cloudinary/';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ Necesita permisos para eliminar
);

export async function deleteProductWithImages(productId: string) {
  // 1. Traer el producto
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('id, images')
    .eq('id', productId)
    .single();

  if (fetchError) {
    console.error('Error al traer el producto:', fetchError.message);
    return;
  }

  // 2. Eliminar imágenes de Cloudinary
  const images = product.images || [];
  for (const img of images) {
    if (img.public_id) {
      try {
        await cloudinary.uploader.destroy(img.public_id);
        console.log(`Imagen eliminada de Cloudinary: ${img.public_id}`);
      } catch (err) {
        console.error('Error eliminando imagen:', err);
      }
    }
  }

  // 3. Eliminar el producto de Supabase
  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (deleteError) {
    console.error('Error al eliminar producto:', deleteError.message);
  } else {
    console.log('Producto eliminado con éxito');
  }
}
