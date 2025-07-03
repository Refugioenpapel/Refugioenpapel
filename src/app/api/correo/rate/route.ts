import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { destinationPostalCode, deliveryType, weight, height, width, length } = await req.json();

    console.log('📦 Datos recibidos:', {
      destinationPostalCode,
      deliveryType,
      weight,
      height,
      width,
      length,
    });

    // Obtener token con Basic Auth
    const tokenRes = await fetch('https://api.correoargentino.com.ar/micorreo/v1/token', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${process.env.CORREO_USER}:${process.env.CORREO_PASS}`).toString('base64'),
      },
    });

    if (!tokenRes.ok) {
      const errorData = await tokenRes.json();
      console.error('❌ Error al obtener token:', errorData);
      return NextResponse.json({ error: 'No se pudo obtener el token' }, { status: 500 });
    }

    const tokenData = await tokenRes.json();
    console.log('🔐 Token recibido:', tokenData);

    const token = tokenData.token;

    // Consulta de tarifas
    const payload = {
      origenPostalCode: '1406', // Flores
      destinoPostalCode: destinationPostalCode,
      deliveryType,
      package: {
        weight,
        height,
        width,
        length,
      },
    };

    console.log('📤 Enviando a /rates:', payload);

    const rateRes = await fetch('https://api.correoargentino.com.ar/micorreo/v1/rates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const rateData = await rateRes.json();
    console.log('📥 Respuesta de /rates:', rateData);

    if (!rateRes.ok) {
      return NextResponse.json({ error: 'No se pudo obtener tarifas', detalle: rateData }, { status: 500 });
    }

    return NextResponse.json({ rates: rateData.rates || [] });
  } catch (error) {
    console.error('❌ Error inesperado al consultar tarifa de envío:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
