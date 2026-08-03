import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const {
      destinationPostalCode,
      deliveryType,
      weight,
      height,
      width,
      length,
    } = await req.json();

    const username = process.env.CORREO_USER;
    const password = process.env.CORREO_PASS;
    const baseURL = process.env.CORREO_BASE_URL || 'https://api.correoargentino.com.ar/micorreo/v1';
    const rawCustomerId = String(process.env.CORREO_CUSTOMER_ID ?? '1654651');
    const customerId = rawCustomerId.padStart(10, '0');
    const postalCodeOrigin = process.env.CORREO_POSTAL_CODE_ORIGIN ?? '1406';

    const fallbackAmount = (() => {
      const numericWeight = Number(weight || 1000);
      const base = deliveryType === 'domicilio' ? 1800 : 1400;
      const extra = Math.max(0, numericWeight - 1000) * 0.8;
      return Number((base + extra).toFixed(2));
    })();

    if (!username || !password) {
      return NextResponse.json({
        status: 200,
        customerId,
        rates: [{ amount: fallbackAmount, source: 'fallback' }],
        note: 'Cotización estimada por falta de credenciales de Correo Argentino',
      });
    }

    if (!destinationPostalCode || !deliveryType || !weight || !height || !width || !length) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios para la cotización' }, { status: 400 });
    }

    const tokenRes = await fetch(`${baseURL}/token`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
      },
    });

    const tokenText = await tokenRes.text();
    let tokenData: any = {};

    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      tokenData = { raw: tokenText };
    }

    if (!tokenRes.ok) {
      console.error('❌ Error al obtener token:', tokenData);
      return NextResponse.json({
        status: 200,
        customerId,
        rates: [{ amount: fallbackAmount, source: 'fallback' }],
        note: 'Cotización estimada por error al obtener el token de Correo Argentino',
        detalle: tokenData,
      });
    }

    const token = tokenData?.token;

    if (!token) {
      return NextResponse.json({ error: 'No se recibió un token válido', detalle: tokenData }, { status: 500 });
    }

    const payload = {
      customerId,
      postalCodeOrigin,
      postalCodeDestination: destinationPostalCode,
      deliveredType: deliveryType === 'domicilio' ? 'D' : 'S',
      dimensions: {
        weight: Number(weight),
        height: Number(height),
        width: Number(width),
        length: Number(length),
      },
    };

    const rateRes = await fetch(`${baseURL}/rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const rateText = await rateRes.text();
    let rateData: any = {};

    try {
      rateData = JSON.parse(rateText);
    } catch {
      rateData = { raw: rateText };
    }

    if (!rateRes.ok) {
      return NextResponse.json({
        status: 200,
        customerId,
        rates: [{ amount: fallbackAmount, source: 'fallback' }],
        note: 'Cotización estimada por error al consultar tarifas de Correo Argentino',
        detalle: rateData,
      });
    }

    return NextResponse.json({
      status: rateRes.status,
      customerId,
      payload,
      rateData,
      rates: Array.isArray(rateData?.rates) ? rateData.rates : [],
    });
  } catch (error) {
    console.error('❌ Error inesperado al consultar tarifa de envío:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
