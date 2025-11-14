import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!, // 🔒 desde .env
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

// helper: trocea un array en partes de tamaño n
function chunk<T>(arr: T[], size = 100): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    // Back-compat: aceptar publicIds (nuevo) o public_ids (legacy)
    const ids: unknown = body.publicIds ?? body.public_ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "publicIds (o public_ids) required" }, { status: 400 });
    }

    const publicIds = ids.filter(Boolean) as string[];
    if (publicIds.length === 0) {
      return NextResponse.json({ error: "Lista de publicIds vacía" }, { status: 400 });
    }

    // 🔹 Borramos en lotes de hasta 100
    const batches = chunk(publicIds, 100);
    const results: Array<{ deleted: Record<string, string>; partial?: boolean }> = [];

    for (const batch of batches) {
      const res = await cloudinary.api.delete_resources(batch, {
        resource_type: "image",
        invalidate: true,
      });
      results.push({ deleted: res.deleted, partial: (res as any).partial || false });
    }

    // Merge de resultados por comodidad
    const merged: Record<string, string> = {};
    let partial = false;
    for (const r of results) {
      Object.assign(merged, r.deleted);
      if (r.partial) partial = true;
    }

    return NextResponse.json({ ok: true, deleted: merged, partial });
  } catch (e: any) {
    console.error("Cloudinary delete error:", e);
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
