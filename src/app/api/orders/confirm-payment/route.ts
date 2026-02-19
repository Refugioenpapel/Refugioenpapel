import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@lib/supabaseAdmin';
import { sendOrderEmail } from '@lib/email/sendOrderEmail';

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
    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.orderId || '').trim();
    const paymentId = String(body?.paymentId || '').trim();
    const statusHint = String(body?.status || '').trim();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId es requerido' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: orderRow, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('order_id,checkout_data,email_sent,payment_status')
      .eq('order_id', orderId)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    if (!orderRow) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (orderRow.email_sent) {
      return NextResponse.json({ ok: true, alreadySent: true });
    }

    let paymentStatus = orderRow.payment_status || '';
    let resolvedPaymentId = paymentId;

    if (paymentId) {
      const payment = await getPaymentInfo(paymentId);
      paymentStatus = String(payment?.status || paymentStatus || '');
      resolvedPaymentId = String(payment?.id || paymentId);

      const externalReference = String(payment?.external_reference || '').trim();
      if (externalReference && externalReference !== orderId) {
        return NextResponse.json({ error: 'external_reference no coincide con el pedido' }, { status: 400 });
      }
    } else if (statusHint) {
      paymentStatus = statusHint;
    }

    const isApproved = paymentStatus === 'approved';
    if (!isApproved) {
      return NextResponse.json({ ok: true, skipped: 'payment_not_approved', paymentStatus });
    }

    const checkoutData = (orderRow.checkout_data || {}) as Record<string, unknown>;
    await sendOrderEmail({
      templateParams: {
        ...checkoutData,
        order_id: orderId,
      },
    });

    await supabaseAdmin
      .from('orders')
      .update({
        status: 'paid',
        payment_status: paymentStatus,
        mp_payment_id: resolvedPaymentId || null,
        email_sent: true,
        email_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderId);

    return NextResponse.json({ ok: true, sent: true });
  } catch (error: any) {
    console.error('orders.confirm-payment error:', error);
    return NextResponse.json(
      { error: 'Error confirmando pago y enviando email', detail: error?.message || null },
      { status: 500 }
    );
  }
}

