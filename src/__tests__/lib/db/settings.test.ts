import { describe, it, expect } from 'vitest';
import { SETTING_DEFAULTS, shippingRuleFrom, type Settings } from '@/lib/db/settings';

const withShipping = (fee: string, freeAbove: string): Settings => ({
  ...SETTING_DEFAULTS,
  shippingFee: fee,
  freeShippingAbove: freeAbove,
});

describe('shippingRuleFrom', () => {
  it('parses stored strings into numbers', () => {
    expect(shippingRuleFrom(withShipping('120', '1500'))).toEqual({ fee: 120, freeAbove: 1500 });
  });

  it('accepts zero for both', () => {
    expect(shippingRuleFrom(withShipping('0', '0'))).toEqual({ fee: 0, freeAbove: 0 });
  });

  it('falls back to the defaults on junk rather than charging nonsense', () => {
    const rule = shippingRuleFrom(withShipping('abc', ''));
    expect(rule.fee).toBe(Number(SETTING_DEFAULTS.shippingFee));
    expect(rule.freeAbove).toBe(Number(SETTING_DEFAULTS.freeShippingAbove));
  });

  it('rejects a negative stored fee', () => {
    expect(shippingRuleFrom(withShipping('-50', '999')).fee).toBe(
      Number(SETTING_DEFAULTS.shippingFee)
    );
  });
});
