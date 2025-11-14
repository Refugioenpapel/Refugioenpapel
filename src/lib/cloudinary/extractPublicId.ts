// /src/lib/cloudinary/extractPublicId.ts
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    // Acepta URL con transformaciones y versiones:
    // https://res.cloudinary.com/<cloud>/image/upload/c_scale,w_800/v1729/folder/file_123.webp
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean); // quita ''
    // buscamos el índice de 'upload' (o 'video/upload' sería similar)
    const uploadIdx = parts.findIndex(p => p === 'upload' || p === 'raw' || p === 'video' || p === 'image');
    // si viene .../image/upload/... el real índice después de 'upload'
    const vIdx = parts.findIndex(p => /^v\d+$/i.test(p));
    const start = vIdx >= 0 ? vIdx + 1 : (uploadIdx >= 0 ? uploadIdx + 1 : 0);
    const after = parts.slice(start).join('/'); // folder/file.ext
    const dot = after.lastIndexOf('.');
    return dot === -1 ? after : after.slice(0, dot);
  } catch {
    return null;
  }
}
