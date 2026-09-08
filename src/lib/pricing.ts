export function sanitizeDiscountPct(value: unknown): number {
  const pct = Number(value ?? 0);
  if (!Number.isFinite(pct)) return 0;
  return Math.min(Math.max(pct, 0), 100);
}

export function applyProductDiscount(price: unknown, discountPct: unknown): number {
  const base = Number(price ?? 0);
  if (!Number.isFinite(base) || base <= 0) return 0;

  const pct = sanitizeDiscountPct(discountPct);
  if (pct <= 0) return Number(base.toFixed(2));

  return Number((base * (1 - pct / 100)).toFixed(2));
}

export function hasProductDiscount(discountPct: unknown): boolean {
  return sanitizeDiscountPct(discountPct) > 0;
}

function numericOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;

  let normalized: unknown = value;

  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/[^0-9,.-]/g, '');

    if (!cleaned) return null;

    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');

    if (lastComma > -1 && lastDot > -1) {
      const decimalSeparator = lastComma > lastDot ? ',' : '.';
      normalized = decimalSeparator === ','
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '');
    } else if (lastComma > -1) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (lastDot > -1) {
      const dotParts = cleaned.split('.');
      const lastPart = dotParts[dotParts.length - 1] || '';
      normalized = dotParts.length > 2 || lastPart.length === 3
        ? cleaned.replace(/\./g, '')
        : cleaned;
    } else {
      normalized = cleaned;
    }
  }

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

export function extractCorreoRateAmount(data: any): number | null {
  const directAmount =
    numericOrNull(data?.amount) ??
    numericOrNull(data?.selectedRate?.amount) ??
    numericOrNull(data?.selectedRate?.price) ??
    numericOrNull(data?.selectedRate?.total) ??
    numericOrNull(data?.selectedRate?.cost);

  if (directAmount !== null) return directAmount;

  const candidateRateArrays = [
    data?.rates,
    data?.rateData?.rates,
    data?.rateData,
  ];

  const ratesArray =
    candidateRateArrays.find((candidate) => Array.isArray(candidate) && candidate.length > 0) || [];

  const selectedRate =
    ratesArray.find((rate: any) => String(rate?.productType || '').toUpperCase() === 'CP') ||
    ratesArray.find((rate: any) => String(rate?.productName || '').toLowerCase().includes('clasico')) ||
    ratesArray[0] ||
    null;

  return (
    numericOrNull(selectedRate?.amount) ??
    numericOrNull(selectedRate?.price) ??
    numericOrNull(selectedRate?.total) ??
    numericOrNull(selectedRate?.cost)
  );
}