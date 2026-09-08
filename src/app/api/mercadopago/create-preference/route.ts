import { NextResponse } from 'next/server';
import { mpClient } from '@lib/mercadopago';
import { getSupabaseAdmin } from '@lib/supabaseAdmin';
import { Preference } from 'mercadopago';

function parsePhone(raw?: string) {
  if (!raw) return null;

  const digits = raw.replace(/\D/g, '');
  let d = digits;

  if (d.startsWith('54')) d = d.slice(2);
  if (d.startsWith('9')) d = d.slice(1);

  if (d.length < 10) return null;

  const area_code = d.slice(0, 2);
  const number = d.slice(2);

  return { area_code, number };
}

function resolveSiteUrl(req: Request) {
  const explicitSiteUrl = String(process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  if (explicitSiteUrl) return explicitSiteUrl.replace(/\/$/, '');

  const deployUrl = String(process.env.DEPLOY_PRIME_URL || process.env.URL || '').trim();
  if (deployUrl) return deployUrl.replace(/\/$/, '');

  return new URL(req.url).origin.replace(/\/$/, '');
}

function isMercadoPagoSandboxEnabled() {
  return String(process.env.MERCADOPAGO_USE_SANDBOX || '').toLowerCase() === 'true';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, orderId, payer, shipping } = body;
    const siteUrl = resolveSiteUrl(req);
    const useSandbox = isMercadoPagoSandboxEnabled();

    const preference = new Preference(mpClient);
    const phoneObj = parsePhone(payer?.phone);

    const email = payer?.email ? String(payer.email) : '';

    const normalizedShippingCost = Number(shipping?.cost ?? 0);
    const safeShippingCost = Number.isFinite(normalizedShippingCost) ? normalizedShippingCost : 0;

    const preferenceItems = (items || []).map((item: any) => ({
      title: String(item.title ?? ''),
      quantity: Number(item.quantity ?? 1),
      unit_price: Number(item.unit_price ?? 0),
      currency_id: 'ARS',
    }));

    if (safeShippingCost > 0) {
      preferenceItems.push({
        title: shipping?.mode === 'domicilio' ? 'Envío a domicilio' : 'Envío a sucursal',
        quantity: 1,
        unit_price: safeShippingCost,
        currency_id: 'ARS',
      });
    }

    const result = await preference.create({
      body: {
        items: preferenceItems,

        payer: {
          name: payer?.name ? String(payer.name) : undefined,
          surname: payer?.surname ? String(payer.surname) : undefined,
          email: email || undefined,
          phone: phoneObj ?? undefined,
        },

        external_reference: String(orderId),

        back_urls: {
          success: `${siteUrl}/resumen?pedido=${orderId}&email=${encodeURIComponent(email)}`,
          failure: `${siteUrl}/checkout?status=failure`,
          pending: `${siteUrl}/checkout?status=pending`,
        },

        auto_return: 'approved',

        notification_url: `${siteUrl}/api/mercadopago/webhook`,
      },
    });

    const checkoutUrl = useSandbox && result.sandbox_init_point
      ? result.sandbox_init_point
      : result.init_point;

    try {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin
        .from('orders')
        .update({
          mp_preference_id: String((result as any)?.id || ''),
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', String(orderId));
    } catch (supabaseError) {
      console.error('No se pudo guardar mp_preference_id:', supabaseError);
    }

    return NextResponse.json({
      init_point: checkoutUrl,
      production_init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      sandbox: useSandbox,
    });
  } catch (error: any) {
    console.error('MercadoPago error:', error);

    const detail =
      error?.message ||
      error?.cause?.message ||
      error?.response?.data ||
      error?.response?.body ||
      null;

    return NextResponse.json(
      { error: 'Error creando preferencia de Mercado Pago', detail },
      { status: 500 }
    );
  }
}
