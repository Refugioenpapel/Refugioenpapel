import { NextResponse } from 'next/server';
import { mpClient } from '@lib/mercadopago';
import { Preference } from 'mercadopago';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, orderId, payer } = body;

    const preference = new Preference(mpClient);

    const result = await preference.create({
      body: {
        items: items.map((item: any) => ({
          title: item.title,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          currency_id: 'ARS',
        })),
        payer,
        external_reference: orderId,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SITE_URL}/resumen?pedido=${orderId}`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?status=failure`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?status=pending`,
        },
        auto_return: 'approved',
      },
    });

    return NextResponse.json({
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (error) {
    console.error('MercadoPago error:', error);
    return NextResponse.json(
      { error: 'Error creando preferencia de Mercado Pago' },
      { status: 500 }
    );
  }
}
