// app/api/mercadopago/create-preference/route.ts
import { NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { mpClient } from "@lib/mercadopago";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, orderId, payer } = body;

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Falta MERCADOPAGO_ACCESS_TOKEN en el entorno" },
        { status: 500 }
      );
    }

    // En Netlify suele existir URL / DEPLOY_PRIME_URL
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.URL ||
      process.env.DEPLOY_PRIME_URL;

    if (!baseUrl) {
      return NextResponse.json(
        { error: "Falta NEXT_PUBLIC_SITE_URL (o URL de Netlify) en el entorno" },
        { status: 500 }
      );
    }

    const preference = new Preference(mpClient);

    const result = await preference.create({
      body: {
        items: (items || []).map((item: any) => ({
          title: item.title,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          currency_id: "ARS",
        })),
        payer,
        external_reference: String(orderId),
        back_urls: {
          success: `${baseUrl}/resumen?pedido=${orderId}`,
          failure: `${baseUrl}/checkout?status=failure`,
          pending: `${baseUrl}/checkout?status=pending`,
        },
        auto_return: "approved",
      },
    });

    return NextResponse.json({
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (error: any) {
    console.error("MercadoPago error (create-preference):", error);

    // DEVUELVO el mensaje real para que lo veas en Network (sin exponer tokens)
    return NextResponse.json(
      { error: "Error creando preferencia de Mercado Pago", detail: error?.message || String(error) },
      { status: 500 }
    );
  }
}
