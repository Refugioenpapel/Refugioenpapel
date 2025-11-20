// src/lib/cloudinary/uploadImage.ts

export type UploadedImage = {
  url: string;
  public_id: string;
};

/**
 * Sube una imagen al endpoint interno /api/upload-image
 * y devuelve { url, public_id } de Cloudinary.
 *
 * Se encarga de:
 *  - Mandar el FormData con file + folder
 *  - Leer la respuesta como texto
 *  - Intentar parsear JSON
 *  - Lanzar errores legibles si algo falla
 */
export async function uploadImageToCloudinary(
  file: File,
  folder: string = "productos"
): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const res = await fetch("/api/upload-image", {
    method: "POST",
    body: formData,
  });

  // Leemos como texto para evitar el "Unexpected token 'I'" si viene un "Internal Server Error"
  const raw = await res.text();

  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Respuesta no válida (no es JSON):", raw);
    throw new Error(`Respuesta no válida del servidor: ${raw}`);
  }

  if (!res.ok) {
    console.error("Error al subir imagen (API):", data);
    throw new Error(data?.error || "Error al subir imagen");
  }

  if (!data?.url || !data?.public_id) {
    console.error("Respuesta inesperada del servidor:", data);
    throw new Error("El servidor no devolvió los datos de la imagen esperados.");
  }

  return {
    url: data.url,
    public_id: data.public_id,
  } as UploadedImage;
}
