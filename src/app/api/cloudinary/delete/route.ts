// /app/api/cloudinary/delete.ts

import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dr5kd2z7y', // reemplazá si cambia tu cloud_name
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const { public_ids } = await req.json();

    if (!public_ids || !Array.isArray(public_ids)) {
      return NextResponse.json({ error: 'Faltan los public_ids' }, { status: 400 });
    }

    const deleteResults = await Promise.all(
      public_ids.map((id: string) =>
        cloudinary.uploader.destroy(id).catch((err) => ({ error: err.message }))
      )
    );

    return NextResponse.json({ success: true, results: deleteResults });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
