import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@lib/supabaseAdmin';
import { requireAdmin } from '@lib/adminAuth';
import { sendOrderEmail } from '@lib/email/sendOrderEmail';
import { importShippingForOrder } from '@lib/correoArgentino/shippingImportHelper';

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
  const adminCheck = await requireAdmin(req);
  if (!adminCheck.ok) {
    const status = adminCheck.reason === 'forbidden' ? 403 : 401;
    return NextResponse.json({ error: adminCheck.reason }, { status });
  }

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
      .select('order_id, checkout_data, email_sent, cart_items')
      .eq('order_id', orderId)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    if (!orderRow) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    let paymentStatus = statusHint || 'approved';
    let resolvedPaymentId = paymentId || null;

    if (paymentId) {
      const payment = await getPaymentInfo(paymentId);
      paymentStatus = String(payment?.status || paymentStatus || '');
      resolvedPaymentId = String(payment?.id || paymentId);

      const externalReference = String(payment?.external_reference || '').trim();
      if (externalReference && externalReference !== orderId) {
        return NextResponse.json({ error: 'external_reference no coincide con el pedido' }, { status: 400 });
      }
    }

    const isApproved = paymentStatus === 'approved';
    if (!isApproved) {
      return NextResponse.json({ ok: true, skipped: 'payment_not_approved', paymentStatus });
    }

    const checkoutData = orderRow.checkout_data as Record<string, unknown> | null;
    const alreadySent = Boolean(orderRow.email_sent);

    if (!alreadySent && checkoutData) {
      try {
        await sendOrderEmail({
          templateParams: {
            ...checkoutData,
            order_id: orderId,
          },
        });
      } catch (emailError: any) {
        console.warn('admin.orders.confirm-payment email skipped:', emailError?.message || emailError);
      }
    }

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

    let shippingImportResult: any = null;
    if (checkoutData) {
      try {
        shippingImportResult = await importShippingForOrder({
          orderId,
          checkoutData,
          cartItems: Array.isArray(orderRow.cart_items) ? orderRow.cart_items : [],
          supabaseAdmin,
        });
      } catch (importError: any) {
        console.warn('admin.orders.confirm-payment shipping import skipped:', importError?.message || importError);
        shippingImportResult = {
          imported: false,
          skipped: false,
          reason: 'exception',
          error: importError?.message || String(importError),
        };
      }
    }

    return NextResponse.json({ ok: true, sent: !alreadySent, shippingImport: shippingImportResult });
  } catch (error: any) {
    console.error('admin.orders.confirm-payment error:', error);
    return NextResponse.json(
      { error: 'Error confirmando pago de pedido', detail: error?.message || null },
      { status: 500 }
    );
  }
}
