// app/api/upload-image/route.ts
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { NextRequest, NextResponse } from 'next/server';

// Configura Cloudinary
cloudinary.config({
  cloud_name: 'dr5kd2z7y',
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

type UploadResult = {
  secure_url: string;
  public_id: string;
};

function uploadImageToCloudinary(fileBuffer: Buffer, folder: string): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = (cloudinary.uploader.upload_stream as unknown as (
      options: { folder: string },
      callback: (error: unknown, result: UploadResult | undefined) => void
    ) => NodeJS.WritableStream)(
      { folder },
      (error, result) => {
        if (error || !result) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    const readable = new Readable();
    readable._read = () => {};
    readable.push(fileBuffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

// ✅ Handler HTTP POST que espera FormData
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await uploadImageToCloudinary(buffer, 'productos');

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 });
  }
}
