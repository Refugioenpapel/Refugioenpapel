import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@lib/supabaseAdmin';
import { sendOrderEmail } from '@lib/email/sendOrderEmail';

function mapOrderStatus(paymentStatus: string) {
  if (paymentStatus === 'approved') return 'paid';
  if (paymentStatus === 'pending' || paymentStatus === 'in_process') return 'pending_payment';
  if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') return 'payment_failed';
  return 'payment_unknown';
}

async function getPaymentInfo(paymentId: string) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN');

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`No se pudo consultar pago en MP: ${body}`);
  }

  return res.json();
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    const type =
      url.searchParams.get('type') ||
      url.searchParams.get('topic') ||
      body?.type ||
      body?.topic ||
      '';

    const paymentId =
      String(
        url.searchParams.get('id') ||
          url.searchParams.get('data.id') ||
          body?.data?.id ||
          body?.id ||
          ''
      ).trim();

    if (type !== 'payment' || !paymentId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const payment = await getPaymentInfo(paymentId);
    const paymentStatus = String(payment?.status || '');
    const orderId = String(payment?.external_reference || '').trim();

    if (!orderId) {
      return NextResponse.json({ ok: true, ignored: 'missing_external_reference' });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: orderRow, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, checkout_data, email_sent')
      .eq('order_id', orderId)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json(
        { error: 'No se pudo leer pedido en Supabase', detail: orderError.message },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: mapOrderStatus(paymentStatus),
        payment_status: paymentStatus,
        mp_payment_id: paymentId,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderId);

    if (updateError) {
      return NextResponse.json(
        { error: 'No se pudo actualizar pedido en Supabase', detail: updateError.message },
        { status: 500 }
      );
    }

    const alreadySent = Boolean(orderRow?.email_sent);

    if (paymentStatus === 'approved' && !alreadySent && orderRow?.checkout_data) {
      const checkoutData = orderRow.checkout_data as Record<string, unknown>;

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
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error procesando webhook MP', detail: error?.message || null },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
