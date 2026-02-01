import { NextResponse } from 'next/server';
import { mpClient } from '@lib/mercadopago';
import { Preference } from 'mercadopago';

function parsePhone(raw?: string) {
  if (!raw) return null;

  // deja solo dígitos
  const digits = raw.replace(/\D/g, '');

  // casos comunes AR: +54 9 11 2409 8439 -> 5491124098439
  // queremos area_code=11 y number=24098439
  // Heurística:
  // - si empieza con 54, lo sacamos
  let d = digits;
  if (d.startsWith('54')) d = d.slice(2);
  // - si sigue con 9 (celular), lo sacamos
  if (d.startsWith('9')) d = d.slice(1);

  // ahora esperamos algo tipo: 11 + 8 dígitos (CABA) o 2-4 + resto
  // Tomamos 2 dígitos de area por default (11) si alcanza, si no: null
  if (d.length < 10) return null;

  const area_code = d.slice(0, 2);
  const number = d.slice(2);

  // MercadoPago espera strings numéricos
  return { area_code, number };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, orderId, payer } = body;

    const preference = new Preference(mpClient);

    const phoneObj = parsePhone(payer?.phone);

    const result = await preference.create({
      body: {
        items: (items || []).map((item: any) => ({
          title: String(item.title ?? ''),
          quantity: Number(item.quantity ?? 1),
          unit_price: Number(item.unit_price ?? 0),
          currency_id: 'ARS',
        })),

        payer: {
          name: payer?.name ? String(payer.name) : undefined,
          surname: payer?.surname ? String(payer.surname) : undefined,
          email: payer?.email ? String(payer.email) : undefined,
          // ✅ SOLO lo mandamos si está bien formado
          phone: phoneObj ?? undefined,
        },

        external_reference: String(orderId),

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
  } catch (error: any) {
    console.error('MercadoPago error:', error);

    // ✅ Intentamos devolver el detalle real si viene del SDK
    const detail =
      error?.message ||
      error?.cause?.message ||
      error?.response?.data ||
      error?.response?.body ||
      null;

    return NextResponse.json(
      {
        error: 'Error creando preferencia de Mercado Pago',
        detail,
      },
      { status: 500 }
    );
  }
}
