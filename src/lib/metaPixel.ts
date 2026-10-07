export type MetaPixelEventName =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase';

type MetaPixelParams = Record<string, unknown>;

type WindowWithMetaPixel = Window & {
  fbq?: (
    action: 'track',
    eventName: MetaPixelEventName,
    params?: MetaPixelParams,
    options?: { eventID?: string }
  ) => void;
};

export function trackMetaPixel(
  eventName: MetaPixelEventName,
  params?: MetaPixelParams,
  options?: { eventID?: string }
) {
  if (typeof window === 'undefined') return;

  const fbq = (window as WindowWithMetaPixel).fbq;
  if (typeof fbq !== 'function') return;

  fbq('track', eventName, params, options);
}

export function normalizeMetaValue(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) return 0;

  return Number(numericValue.toFixed(2));
}