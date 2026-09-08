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

const provinceNameToCode: Record<string, string> = {
  salta: 'A',
  'buenos aires': 'B',
  'provincia de buenos aires': 'B',
  'ciudad autonoma de buenos aires': 'C',
  'ciudad autónoma de buenos aires': 'C',
  'capital federal': 'C',
  catamarca: 'K',
  chaco: 'H',
  chubut: 'U',
  cordoba: 'X',
  córdoba: 'X',
  corrientes: 'W',
  'entre rios': 'E',
  'entre ríos': 'E',
  formosa: 'P',
  jujuy: 'Y',
  'la pampa': 'L',
  'la rioja': 'F',
  mendoza: 'M',
  misiones: 'N',
  neuquen: 'Q',
  neuquén: 'Q',
  'rio negro': 'R',
  'río negro': 'R',
  'santa fe': 'S',
  'san juan': 'J',
  'san luis': 'D',
  'santa cruz': 'Z',
  'santiago del estero': 'G',
  'tierra del fuego': 'V',
  tucuman: 'T',
  tucumán: 'T',
};

const normalizeText = (value: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

function getProvinceCodeFromName(name: string) {
  return provinceNameToCode[normalizeText(name)] || name;
}

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
  agency?: string;
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
        agency: options.deliveryType === 'sucursal' ? options.agency || null : null,
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

  const declaredValue = Math.max(
    1,
    options.items.reduce((sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 1), 0)
  );

  const payload = {
    customerId,
    extOrderId: String(options.orderId),
    orderNumber: String(options.orderId),
    sender: {
      name: 'Refugio en Papel',
      phone: process.env.ADMIN_PHONE || '',
      cellPhone: process.env.ADMIN_PHONE || '',
      email: process.env.ADMIN_EMAIL || '',
      originAddress: {
        streetName: process.env.CORREO_SENDER_STREET || null,
        streetNumber: process.env.CORREO_SENDER_STREET_NUMBER || null,
        floor: process.env.CORREO_SENDER_FLOOR || null,
        apartment: process.env.CORREO_SENDER_APARTMENT || null,
        city: process.env.CORREO_SENDER_CITY || null,
        provinceCode: process.env.CORREO_SENDER_PROVINCE_CODE || null,
        postalCode: postalCodeOrigin,
      },
    },
    recipient: {
      name: options.customerName,
      phone: options.customerPhone,
      cellPhone: options.customerPhone,
      email: options.customerEmail,
    },
    shipping: {
      deliveryType: options.deliveryType === 'domicilio' ? 'D' : 'S',
      agency: options.deliveryType === 'sucursal' ? options.agency || null : null,
      address: {
        streetName: options.address.street,
        streetNumber: options.address.number,
        floor: (options.address.floor || '').slice(0, 3),
        apartment: (options.address.apartment || '').slice(0, 3),
        city: options.address.locality,
        provinceCode: getProvinceCodeFromName(options.address.province),
        postalCode: options.address.postalCode,
      },
      productType: 'CP',
      weight: Number(options.dimensions.weight),
      declaredValue,
      height: Number(options.dimensions.height),
      length: Number(options.dimensions.length),
      width: Number(options.dimensions.width),
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
