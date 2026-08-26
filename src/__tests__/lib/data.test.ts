import { describe, it, expect } from 'vitest';
import { priceFor, shippingFor, SIZE_UPCHARGE, SHIPPING_DEFAULTS } from '@/lib/data';

describe('priceFor', () => {
  const product = { base: 199, priceA3: 349, priceA2: 549 };

  it('returns the per-size price for each size', () => {
    expect(priceFor(product, 'A4')).toBe(199);
    expect(priceFor(product, 'A3')).toBe(349);
    expect(priceFor(product, 'A2')).toBe(549);
  });

  it('honours prices that do not follow the legacy upcharge steps', () => {
    expect(priceFor({ base: 500, priceA3: 520, priceA2: 530 }, 'A3')).toBe(520);
  });

  it('falls back to the legacy upcharges when a size price is missing', () => {
    expect(priceFor({ base: 499 }, 'A3')).toBe(499 + SIZE_UPCHARGE.A3);
    expect(priceFor({ base: 499, priceA2: null }, 'A2')).toBe(499 + SIZE_UPCHARGE.A2);
  });
});

describe('shippingFor', () => {
  const rule = { fee: 79, freeAbove: 999 };

  it('charges the fee below the threshold', () => {
    expect(shippingFor(998, rule)).toBe(79);
  });

  it('is free at the threshold and above', () => {
    expect(shippingFor(999, rule)).toBe(0);
    expect(shippingFor(5000, rule)).toBe(0);
  });

  it('charges nothing on an empty cart', () => {
    expect(shippingFor(0, rule)).toBe(0);
  });

  it('treats a zero threshold as free delivery on everything', () => {
    expect(shippingFor(50, { fee: 79, freeAbove: 0 })).toBe(0);
  });

  it('honours a zero fee', () => {
    expect(shippingFor(50, { fee: 0, freeAbove: 999 })).toBe(0);
  });

  it('ships with sane defaults', () => {
    expect(SHIPPING_DEFAULTS).toEqual({ fee: 79, freeAbove: 999 });
  });
});
