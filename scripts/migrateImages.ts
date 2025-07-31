// scripts/migrateImages.ts

import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import https from 'https';

// 👇 Pegá tus valores reales entre comillas
const SUPABASE_URL = 'https://wifxignbduaxgtberblz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZnhpZ25iZHVheGd0YmVyYmx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MDY2MTksImV4cCI6MjA2NDI4MjYxOX0.WY2MHxjJKIfKKxFacCe-bcA0MdfDR5zP_Yerf9zUj7w'; // tu clave real

const CLOUDINARY_CLOUD_NAME = 'dr5kd2z7y';
const CLOUDINARY_API_KEY = '894276426934785';
const CLOUDINARY_API_SECRET = 'YL0-s4_EwT3_KWLhAEZGKudLfZ8';

// Configuración de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

async function downloadImageAsBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks: Uint8Array[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
  });
}

async function uploadToCloudinary(buffer: Buffer, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'productos',
        public_id: filename,
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

async function migrateImages() {
  const { data: productos, error } = await supabase.from('products').select('*');

  if (error) {
    console.error('Error al obtener productos:', error.message);
    return;
  }

  for (const producto of productos!) {
    if (!producto.image_url || producto.image_url.includes('res.cloudinary.com')) {
      console.log(`🟡 Saltando producto ${producto.name} (ya migrado o sin imagen)`);
      continue;
    }

    const supabaseImageUrl = `${SUPABASE_URL}/storage/v1/object/public/${producto.image_url}`;
    console.log(`🔄 Migrando imagen de ${producto.name} desde Supabase: ${supabaseImageUrl}`);

    try {
      const imageBuffer = await downloadImageAsBuffer(supabaseImageUrl);
      const filename = `${Date.now()}-${producto.id}`;
      const cloudinaryUrl = await uploadToCloudinary(imageBuffer, filename);

      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: cloudinaryUrl })
        .eq('id', producto.id);

      if (updateError) {
        console.error(`❌ Error al actualizar producto ${producto.id}:`, updateError.message);
      } else {
        console.log(`✅ Imagen actualizada: ${cloudinaryUrl}`);
      }
    } catch (err) {
      console.error(`❌ Error al migrar imagen de producto ${producto.name}:`, err);
    }
  }
}

migrateImages();
