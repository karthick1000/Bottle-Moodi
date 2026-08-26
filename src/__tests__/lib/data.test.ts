import { describe, it, expect } from 'vitest';
import { priceFor, SIZE_UPCHARGE } from '@/lib/data';

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
