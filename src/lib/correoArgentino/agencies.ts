import { getCorreoArgentinoToken } from './getToken';
import type { CorreoSucursalOption } from './branchLookup';

const provinceNameToCode: Record<string, string> = {
  'salta': 'A',
  'buenos aires': 'B',
  'provincia de buenos aires': 'B',
  'ciudad autonoma de buenos aires': 'C',
  'ciudad autónoma de buenos aires': 'C',
  'capital federal': 'C',
  'catamarca': 'K',
  'chaco': 'H',
  'chubut': 'U',
  'cordoba': 'X',
  'córdoba': 'X',
  'corrientes': 'W',
  'entre rios': 'E',
  'entre ríos': 'E',
  'formosa': 'P',
  'jujuy': 'Y',
  'la pampa': 'L',
  'la rioja': 'F',
  'mendoza': 'M',
  'misiones': 'N',
  'neuquen': 'Q',
  'neuquén': 'Q',
  'rio negro': 'R',
  'río negro': 'R',
  'santa fe': 'S',
  'san juan': 'J',
  'san luis': 'D',
  'santa cruz': 'Z',
  'santiago del estero': 'G',
  'tierra del fuego': 'V',
  'tucuman': 'T',
  'tucumán': 'T',
};

const normalizeText = (value: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

function getProvinceCodeFromName(name: string | undefined | null) {
  if (!name) return undefined;
  return provinceNameToCode[normalizeText(name)];
}

function getAllProvinceCodes() {
  return Array.from(new Set(Object.values(provinceNameToCode))).sort();
}

function parseAgency(raw: any): CorreoSucursalOption {
  const address = raw?.location?.address || {};
  const street = [address?.streetName, address?.streetNumber]
    .filter(Boolean)
    .join(' ');

  return {
    id: raw?.code || raw?.id || `${address?.postalCode || ''}-${raw?.name || ''}`,
    title: raw?.name || raw?.code || 'Sucursal Correo Argentino',
    address: street || String(address?.postalCode || raw?.name || 'Dirección no disponible'),
    locality: address?.locality || address?.city || '',
    province: address?.province || '',
    postalCode: address?.postalCode || '',
    city: address?.city || '',
    services: raw?.services,
    latitude: raw?.location?.latitude,
    longitude: raw?.location?.longitude,
  };
}

function agencyAllowsPickup(raw: any) {
  return raw?.status !== 'INACTIVE' && raw?.services?.pickupAvailability === true;
}

function getPostalCodeDigits(value?: string | null) {
  return String(value || '').replace(/\D/g, '');
}

function getPostalCodeNumber(value?: string | null) {
  const digits = getPostalCodeDigits(value);
  return digits.length >= 4 ? Number(digits.slice(0, 4)) : null;
}

function getPostalDistance(a?: string | null, b?: string | null) {
  const aNumber = getPostalCodeNumber(a);
  const bNumber = getPostalCodeNumber(b);

  if (aNumber === null || bNumber === null) return null;
  return Math.abs(aNumber - bNumber);
}

function scoreAgency(
  agency: CorreoSucursalOption,
  locality?: string,
  postalCode?: string
) {
  let score = 0;
  const normalizedLocality = normalizeText(locality || '');
  const normalizedAgencyLocality = normalizeText(agency.locality || agency.city || '');

  if (normalizedLocality && normalizedAgencyLocality) {
    if (normalizedAgencyLocality === normalizedLocality) score += 20;
    if (normalizedAgencyLocality.includes(normalizedLocality)) score += 10;
    if (normalizeText(agency.title).includes(normalizedLocality)) score += 5;
  }

  if (postalCode && agency.postalCode) {
    const inputPostalDigits = getPostalCodeDigits(postalCode);
    const agencyPostalDigits = getPostalCodeDigits(agency.postalCode);
    const normalizedPostalCode = normalizeText(postalCode);
    const agencyPostal = normalizeText(agency.postalCode);

    if (inputPostalDigits && agencyPostalDigits) {
      if (agencyPostalDigits === inputPostalDigits) score += 30;
      else if (agencyPostalDigits.startsWith(inputPostalDigits)) score += 20;

      const distance = getPostalDistance(inputPostalDigits, agencyPostalDigits);
      if (distance !== null) {
        if (distance <= 5) score += 12;
        else if (distance <= 15) score += 8;
        else if (distance <= 30) score += 4;
      }
    }

    if (normalizedPostalCode && agencyPostal.includes(normalizedPostalCode)) score += 8;
  }

  return score;
}

function rankAgencies(
  options: CorreoSucursalOption[],
  locality?: string,
  postalCode?: string
) {
  const normalizedPostalCode = getPostalCodeDigits(postalCode);
  const ranked = options
    .map((option) => ({ option, score: scoreAgency(option, locality, postalCode) }))
    .sort((a, b) => b.score - a.score);

  const normalizedLocality = normalizeText(locality || '');

  if (!normalizedLocality && !normalizedPostalCode) {
    return ranked.slice(0, 3).map(({ option }) => option);
  }

  const postalMatches = normalizedPostalCode
    ? ranked.filter(({ option }) => getPostalCodeDigits(option.postalCode) === normalizedPostalCode)
    : [];
  if (postalMatches.length > 0) {
    return postalMatches.slice(0, 3).map(({ option }) => option);
  }

  const nearbyPostalMatches = normalizedPostalCode
    ? ranked.filter(({ option }) => {
        const distance = getPostalDistance(normalizedPostalCode, option.postalCode);
        return distance !== null && distance <= 30;
      })
    : [];
  if (nearbyPostalMatches.length > 0) {
    return nearbyPostalMatches.slice(0, 3).map(({ option }) => option);
  }

  if (normalizedLocality) {
    const exactLocality = ranked.filter(
      ({ option }) =>
        normalizeText(option.locality || option.city || '') === normalizedLocality
    );
    if (exactLocality.length > 0) {
      return exactLocality.slice(0, 3).map(({ option }) => option);
    }

    const partialLocality = ranked.filter(({ option }) => {
      const agencyLocality = normalizeText(option.locality || option.city || '');
      return (
        agencyLocality.includes(normalizedLocality) ||
        normalizedLocality.includes(agencyLocality) ||
        normalizeText(option.title).includes(normalizedLocality)
      );
    });
    if (partialLocality.length > 0) {
      return partialLocality.slice(0, 3).map(({ option }) => option);
    }
  }

  return [];
}

export async function getCorreoArgentinoAgencies(
  provinceCode: string,
  token?: string
) {
  const customerId = String(process.env.CORREO_CUSTOMER_ID || '').trim().padStart(10, '0');
  if (!customerId) {
    throw new Error('Falta CORREO_CUSTOMER_ID en variables de entorno');
  }

  const authToken = token ?? (await getCorreoArgentinoToken());
  const baseURL = process.env.CORREO_BASE_URL || 'https://api.correoargentino.com.ar/micorreo/v1';

  const params = new URLSearchParams({
    customerId,
    provinceCode,
    services: 'pickup_availability',
  });

  const response = await fetch(`${baseURL}/agencies?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error al consultar agencies: ${response.status} ${text}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Respuesta inesperada de agencies');
  }

  return data.filter(agencyAllowsPickup).map((raw) => parseAgency(raw));
}

export async function fetchSucursalOptionsForCp(options: {
  cp?: string;
  provincia?: string;
  localidad?: string;
}) {
  const provinceCode = getProvinceCodeFromName(options.provincia);
  const locality = options.localidad;
  const postalCode = options.cp;

  if (provinceCode) {
    const agencies = await getCorreoArgentinoAgencies(provinceCode);
    return rankAgencies(agencies, locality, postalCode).slice(0, 3);
  }

  if (postalCode) {
    const token = await getCorreoArgentinoToken();
    const provinceCodes = getAllProvinceCodes();
    const agenciesByProvince = await Promise.allSettled(
      provinceCodes.map((code) => getCorreoArgentinoAgencies(code, token))
    );

    const agencies = agenciesByProvince.flatMap((result) =>
      result.status === 'fulfilled' ? result.value : []
    );

    if (agencies.length === 0) {
      return [];
    }

    return rankAgencies(agencies, locality, postalCode).slice(0, 3);
  }

  return [];
}
