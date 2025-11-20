// src/app/api/upload-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// 👇 MUY IMPORTANTE en Netlify / producción: forzamos Node.js runtime
export const runtime = "nodejs";

// Configuramos Cloudinary usando las variables de entorno del servidor
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
  process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  // Esto se ejecuta en build/server, sólo loguea en consola del servidor
  console.error(
    "[upload-image] Faltan variables de entorno de Cloudinary en el servidor"
  );
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    const folder = (formData.get("folder") as string) || "productos";

    if (!file) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo" },
        { status: 400 }
      );
    }

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: "Cloudinary no está configurado en el servidor" },
        { status: 500 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder },
        (err, res) => {
          if (err || !res) {
            return reject(err || new Error("Upload failed"));
          }
          resolve({
            secure_url: res.secure_url,
            public_id: res.public_id,
          });
        }
      );
      stream.end(buffer);
    });

    return NextResponse.json(
      { url: result.secure_url, public_id: result.public_id },
      { status: 200 }
    );
  } catch (error) {
    console.error("[upload-image] Error al subir imagen:", error);
    return NextResponse.json(
      { error: "Error al subir imagen" },
      { status: 500 }
    );
  }
}
