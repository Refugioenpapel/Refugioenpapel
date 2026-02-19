import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@lib/supabaseAdmin';
import { sendOrderEmail } from '@lib/email/sendOrderEmail';

const FALLBACK_ADMIN_EMAIL = 'mirefugioenpapel@gmail.com';

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';

  if (!token) {
    console.error('admin.orders auth missing bearer token');
    return { ok: false as const, reason: 'unauthorized' };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    console.error('admin.orders auth invalid token', userError);
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
    console.error('admin.orders forbidden', {
      userId: user.id,
      email: user.email,
      profileError: profileError?.message || null,
      profileRol: profile?.rol || null,
    });
    return { ok: false as const, reason: 'forbidden' };
  }

  return { ok: true as const, userId: user.id };
}

export async function GET(req: Request) {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck.ok) {
    const status = adminCheck.reason === 'forbidden' ? 403 : 401;
    return NextResponse.json({ error: adminCheck.reason }, { status });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const limitParam = Number(url.searchParams.get('limit') || 100);
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(300, limitParam)) : 100;

  const supabaseAdmin = getSupabaseAdmin();
  let query = supabaseAdmin
    .from('orders')
    .select(
      'order_id,status,payment_method,payment_status,mp_payment_id,customer_name,customer_email,amount_total,currency,email_sent,email_sent_at,created_at,updated_at'
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
    const status = adminCheck.reason === 'forbidden' ? 403 : 401;
    return NextResponse.json({ error: adminCheck.reason }, { status });
  }

  const body = await req.json().catch(() => null);
  const orderId = String(body?.orderId || '').trim();
  const status = String(body?.status || '').trim();
  const sendEmail = Boolean(body?.sendEmail);

  if (!orderId || (!status && !sendEmail)) {
    return NextResponse.json({ error: 'orderId y status son requeridos (o sendEmail=true)' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: existingOrder, error: existingOrderError } = await supabaseAdmin
    .from('orders')
    .select('order_id,status,checkout_data,email_sent')
    .eq('order_id', orderId)
    .maybeSingle();

  if (existingOrderError) {
    return NextResponse.json({ error: existingOrderError.message }, { status: 500 });
  }

  if (!existingOrder) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (status) {
    updatePayload.status = status;
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update(updatePayload)
    .eq('order_id', orderId)
    .select('order_id,status,updated_at,email_sent')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const shouldSendEmail =
    sendEmail || (status === 'paid' && !Boolean(existingOrder.email_sent));

  if (shouldSendEmail) {
    const checkoutData = (existingOrder.checkout_data || {}) as Record<string, unknown>;
    if (!checkoutData || Object.keys(checkoutData).length === 0) {
      return NextResponse.json(
        { error: 'No hay checkout_data para reenviar email en este pedido' },
        { status: 400 }
      );
    }

    try {
      await sendOrderEmail({
        templateParams: {
          ...checkoutData,
          order_id: orderId,
        },
      });

      await supabaseAdmin
        .from('orders')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId);
    } catch (sendError: any) {
      console.error('admin.orders send email error:', sendError);
      return NextResponse.json(
        { error: 'No se pudo enviar email', detail: sendError?.message || null },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true, order: data });
}
