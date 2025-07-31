// src/lib/cloudinary/transformSupabaseUrl.ts

const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/dr5kd2z7y/image/upload/";

export function transformSupabaseImageUrl(url: string): string {
  const filename = url.split("/").pop(); // Extrae el nombre del archivo
  return `${CLOUDINARY_BASE_URL}productos/${filename}`;
}

export function transformImagesArray(images: string[]): string[] {
  return images.map(transformSupabaseImageUrl);
}
