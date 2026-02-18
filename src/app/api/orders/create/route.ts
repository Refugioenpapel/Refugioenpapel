import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@lib/supabaseAdmin';

type CreateOrderBody = {
  orderId: string | number;
  paymentMethod: 'mp' | 'transfer';
  checkoutInfo: Record<string, unknown>;
  cartItems: unknown[];
  amountTotal: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateOrderBody;

    if (!body?.orderId) {
      return NextResponse.json({ error: 'orderId es requerido' }, { status: 400 });
    }

    const orderId = String(body.orderId);
    const checkoutInfo = body.checkoutInfo || {};

    const supabaseAdmin = getSupabaseAdmin();

    const payload = {
      order_id: orderId,
      status: 'initiated',
      payment_method: body.paymentMethod || 'mp',
      customer_email: String(checkoutInfo.email || ''),
      customer_name: `${String(checkoutInfo.nombre || '')} ${String(checkoutInfo.apellido || '')}`.trim(),
      amount_total: Number(body.amountTotal || 0),
      currency: 'ARS',
      checkout_data: checkoutInfo,
      cart_items: body.cartItems || [],
      email_sent: false,
    };

    const { error } = await supabaseAdmin
      .from('orders')
      .upsert(payload, { onConflict: 'order_id' });

    if (error) {
      return NextResponse.json(
        { error: 'No se pudo guardar el pedido en Supabase', detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error creando pedido', detail: error?.message || null },
      { status: 500 }
    );
  }
}

