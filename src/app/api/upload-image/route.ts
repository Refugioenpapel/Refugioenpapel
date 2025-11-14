import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!, // 🔒 ya no hardcodeado
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    const folder = (formData.get("folder") as string) || "productos";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder }, (err, res) => {
        if (err || !res) reject(err || new Error("Upload failed"));
        else resolve(res);
      });
      stream.end(buffer);
    });

    const { secure_url, public_id } = result as { secure_url: string; public_id: string };

    return NextResponse.json({ url: secure_url, public_id }); // 👈 igual formato que te pasé
  } catch (error) {
    console.error("Error al subir imagen:", error);
    return NextResponse.json({ error: "Error al subir imagen" }, { status: 500 });
  }
}
