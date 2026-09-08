import { getSupabaseAdmin } from '@lib/supabaseAdmin';

const FALLBACK_ADMIN_EMAIL = 'mirefugioenpapel@gmail.com';

export async function requireAdmin(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';

  if (!token) {
    console.error('admin auth missing bearer token');
    return { ok: false as const, reason: 'unauthorized' };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    console.error('admin auth invalid token', userError);
    return { ok: false as const, reason: 'unauthorized' };
  }

  const adminEmail = (process.env.ADMIN_EMAIL || FALLBACK_ADMIN_EMAIL).toLowerCase();
  if ((user.email || '').toLowerCase() === adminEmail) {
    return { ok: true as const, userId: user.id };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || profile?.rol !== 'admin') {
    console.error('admin auth forbidden', {
      userId: user.id,
      email: user.email,
      profileError: profileError?.message || null,
      profileRol: profile?.rol || null,
    });
    return { ok: false as const, reason: 'forbidden' };
  }

  return { ok: true as const, userId: user.id };
}
