import { getCorreoArgentinoToken } from './getToken';

export type CorreoArgentinoShippingAddress = {
  street: string;
  number: string;
  floor?: string;
  apartment?: string;
  neighborhood?: string;
  locality: string;
  province: string;
  postalCode: string;
};

export type CorreoArgentinoCartItem = {
  title: string;
  quantity: number;
  unit_price: number;
};

export type CorreoArgentinoShippingImportResult = {
  ok: boolean;
  status: number;
  data: any;
  error?: string;
  raw?: string;
  statusText?: string;
};

export async function importCorreoArgentinoShipping(options: {
  orderId: string;
  destinationPostalCode: string;
  deliveryType: 'domicilio' | 'sucursal';
  dimensions: {
    weight: number;
    height: number;
    width: number;
    length: number;
  };
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: CorreoArgentinoShippingAddress;
  items: CorreoArgentinoCartItem[];
  notes?: string;
}): Promise<CorreoArgentinoShippingImportResult> {
  const rawCustomerId = String(process.env.CORREO_CUSTOMER_ID || '').trim();
  const customerId = rawCustomerId.padStart(10, '0');
  const postalCodeOrigin = process.env.CORREO_POSTAL_CODE_ORIGIN || '1406';
  const baseURL = process.env.CORREO_BASE_URL || 'https://api.correoargentino.com.ar/micorreo/v1';

  const dryRun = (String(process.env.CORREO_DRY_RUN || '').toLowerCase() === 'true') ||
    (String(process.env.CORREO_DRY_RUN || '') === '1');

  if (dryRun) {
    // Simulate successful import without calling external API
    const simulated = {
      importId: `DRYRUN-${String(options.orderId).replace(/[^a-zA-Z0-9_-]/g, '')}`,
      message: 'dry-run: import simulated',
      payloadSent: {
        customerId,
        postalCodeOrigin,
        postalCodeDestination: options.destinationPostalCode,
        deliveredType: options.deliveryType === 'domicilio' ? 'D' : 'S',
      },
    };

    return {
      ok: true,
      status: 200,
      data: simulated,
    };
  }

  const username = process.env.CORREO_USER;
  const password = process.env.CORREO_PASS;

  if (!username || !password) {
    throw new Error('Faltan credenciales de Correo Argentino');
  }

  if (!customerId) {
    throw new Error('Falta CORREO_CUSTOMER_ID');
  }

  const token = await getCorreoArgentinoToken();

  const payload = {
    customerId,
    tipoEnvio: options.deliveryType === 'domicilio' ? 'domicilio' : 'sucursal',
    paquete: {
      peso: Number(options.dimensions.weight),
      alto: Number(options.dimensions.height),
      ancho: Number(options.dimensions.width),
      largo: Number(options.dimensions.length),
    },
    ordenNumero: String(options.orderId),
    ordenReferencia: String(options.orderId),
    descripcion: options.notes || `Pedido ${options.orderId}`,
    receptor: {
      nombre: options.customerName,
      email: options.customerEmail,
      telefono: options.customerPhone,
      direccion: {
        calle: options.address.street,
        numero: options.address.number,
        piso: options.address.floor || null,
        departamento: options.address.apartment || null,
        barrio: options.address.neighborhood || null,
        localidad: options.address.locality,
        provincia: options.address.province,
        codigoPostal: options.address.postalCode,
      },
    },
    remitente: {
      nombre: 'Refugio en Papel',
      email: process.env.ADMIN_EMAIL || '',
      telefono: process.env.ADMIN_PHONE || '',
    },
  };

  const response = await fetch(`${baseURL}/shipping/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let data: any = null;

  try {
    data = JSON.parse(rawText);
  } catch {
    data = { raw: rawText };
  }

  if (!response.ok) {
    const errorMessage =
      data?.error || data?.mensaje || data?.message || data?.descripcion || rawText || 'Error importando envío de Correo Argentino';

    return {
      ok: false,
      status: response.status,
      data,
      error: String(errorMessage),
      raw: rawText,
      statusText: response.statusText,
    };
  }

  return {
    ok: true,
    status: response.status,
    data,
  };
}
