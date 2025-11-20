// app/api/upload-image/route.ts
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

// ⬇️ Leemos una sola vez las env
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

const HAS_CLOUDINARY_CONFIG =
  !!CLOUDINARY_CLOUD_NAME &&
  !!CLOUDINARY_API_KEY &&
  !!CLOUDINARY_API_SECRET;

// Solo configuro si realmente tengo todo
if (HAS_CLOUDINARY_CONFIG) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.error(
    "❌ Faltan variables de entorno de Cloudinary en el servidor. " +
      "Revisá CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET."
  );
}

export async function POST(req: NextRequest) {
  try {
    // Si faltan credenciales => devolvemos error JSON legible
    if (!HAS_CLOUDINARY_CONFIG) {
      return NextResponse.json(
        {
          error:
            "Configuración de Cloudinary incompleta en el servidor. " +
            "Revisá las variables de entorno.",
        },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder") as string) || "productos";

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo válido." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder },
        (err, res) => {
          if (err || !res) {
            return reject(err || new Error("Upload failed"));
          }
          resolve(res);
        }
      );
      stream.end(buffer);
    });

    const { secure_url, public_id } = result;

    return NextResponse.json(
      { url: secure_url, public_id },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error al subir imagen:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Error interno al subir imagen. Revisá los logs del servidor.",
      },
      { status: 500 }
    );
  }
}
