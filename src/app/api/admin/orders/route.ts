import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@lib/supabaseAdmin';

const FALLBACK_ADMIN_EMAIL = 'mirefugioenpapel@gmail.com';

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';

  if (!token) {
    return { ok: false as const, reason: 'unauthorized' };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
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
    return { ok: false as const, reason: 'forbidden' };
  }

  return { ok: true as const, userId: user.id };
}

export async function GET(req: Request) {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.reason }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const limitParam = Number(url.searchParams.get('limit') || 100);
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(300, limitParam)) : 100;

  const supabaseAdmin = getSupabaseAdmin();
  let query = supabaseAdmin
    .from('orders')
    .select(
      'order_id,status,payment_method,payment_status,customer_name,customer_email,amount_total,currency,email_sent,created_at,updated_at'
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: data || [] });
}

export async function PATCH(req: Request) {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.reason }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const orderId = String(body?.orderId || '').trim();
  const status = String(body?.status || '').trim();

  if (!orderId || !status) {
    return NextResponse.json({ error: 'orderId y status son requeridos' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId)
    .select('order_id,status,updated_at')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, order: data });
}
