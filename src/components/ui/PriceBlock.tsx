type PriceBlockProps = {
  price?: number | null;
  discountPct?: number;
  transferDiscountPct?: number;
  currency?: string;
  locale?: string;
  prefix?: string;
  className?: string;
  priceClassName?: string;
  compareClassName?: string;
  transferClassName?: string;
  transferLabel?: string;
  align?: 'left' | 'center';
};

const formatPrice = (value: number, locale: string, currency: string) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace(/\u00a0/g, '');

export default function PriceBlock({
  price,
  discountPct = 0,
  transferDiscountPct = 0.10,
  currency = 'ARS',
  locale = 'es-AR',
  prefix,
  className = '',
  priceClassName = 'text-lg font-bold text-[#A084CA]',
  compareClassName = 'text-gray-400 line-through text-sm',
  transferClassName = 'text-sm text-gray-500',
  transferLabel = 'con Transferencia',
  align = 'left',
}: PriceBlockProps) {
  const safePrice =
    typeof price === 'number' && Number.isFinite(price) ? price : null;
  const hasDiscount = typeof discountPct === 'number' && discountPct > 0;
  const finalPrice =
    safePrice === null
      ? null
      : hasDiscount
      ? safePrice * (1 - discountPct / 100)
      : safePrice;

  const safeTransferPct = Math.min(Math.max(transferDiscountPct, 0), 1);
  const transferPrice =
    finalPrice === null ? null : finalPrice * (1 - safeTransferPct);

  const justifyClass = align === 'center' ? 'justify-center' : 'justify-start';
  const textAlignClass = align === 'center' ? 'text-center' : '';

  const mainLabel =
    finalPrice === null ? '—' : formatPrice(finalPrice, locale, currency);
  const compareLabel =
    safePrice === null ? '—' : formatPrice(safePrice, locale, currency);
  const transferValue =
    transferPrice === null ? '—' : formatPrice(transferPrice, locale, currency);

  return (
    <div className={`${className} ${textAlignClass}`.trim()}>
      <div className={`flex items-baseline gap-2 ${justifyClass}`}>
        {hasDiscount && safePrice !== null && (
          <span className={compareClassName}>{compareLabel}</span>
        )}
        <span className={priceClassName}>
          {prefix && <span className="mr-1">{prefix}</span>}
          {mainLabel}
        </span>
      </div>
      <div className={transferClassName}>
        {transferValue} {transferLabel}
      </div>
    </div>
  );
}
