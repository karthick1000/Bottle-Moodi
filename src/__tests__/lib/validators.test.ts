import { describe, it, expect } from 'vitest';
import {
  addCartItemSchema,
  createOrderSchema,
  newsletterSchema,
  updateOrderStatusSchema,
  createProductSchema,
  updateProductSchema,
} from '@/lib/validators';

describe('addCartItemSchema', () => {
  it('accepts valid input', () => {
    expect(addCartItemSchema.parse({ productId: 1, size: 'A3', amount: 649 }))
      .toEqual({ productId: 1, size: 'A3', amount: 649 });
  });

  it('rejects non-positive productId', () => {
    expect(() => addCartItemSchema.parse({ productId: 0, size: 'A3', amount: 649 })).toThrow();
  });

  it('rejects missing size', () => {
    expect(() => addCartItemSchema.parse({ productId: 1, amount: 649 })).toThrow();
  });

  it('rejects empty size', () => {
    expect(() => addCartItemSchema.parse({ productId: 1, size: '', amount: 649 })).toThrow();
  });

  it('rejects non-positive amount', () => {
    expect(() => addCartItemSchema.parse({ productId: 1, size: 'A3', amount: 0 })).toThrow();
  });
});

describe('createOrderSchema', () => {
  const validItem = { productId: 1, size: 'A4', amount: 499 };

  it('accepts valid input', () => {
    const result = createOrderSchema.parse({ items: [validItem] });
    expect(result.items).toHaveLength(1);
  });

  it('rejects empty items array', () => {
    expect(() => createOrderSchema.parse({ items: [] })).toThrow();
  });

  it('rejects missing items', () => {
    expect(() => createOrderSchema.parse({})).toThrow();
  });

  it('rejects item with invalid productId', () => {
    expect(() => createOrderSchema.parse({ items: [{ ...validItem, productId: -1 }] })).toThrow();
  });
});

describe('newsletterSchema', () => {
  it('accepts valid email', () => {
    expect(newsletterSchema.parse({ email: 'test@example.com' })).toEqual({ email: 'test@example.com' });
  });

  it('rejects invalid email', () => {
    expect(() => newsletterSchema.parse({ email: 'notanemail' })).toThrow();
  });

  it('rejects empty email', () => {
    expect(() => newsletterSchema.parse({ email: '' })).toThrow();
  });

  it('rejects missing email', () => {
    expect(() => newsletterSchema.parse({})).toThrow();
  });
});

describe('updateOrderStatusSchema', () => {
  it('accepts PENDING', () => {
    expect(updateOrderStatusSchema.parse({ status: 'PENDING' })).toEqual({ status: 'PENDING' });
  });

  it('accepts PAID', () => {
    expect(updateOrderStatusSchema.parse({ status: 'PAID' })).toEqual({ status: 'PAID' });
  });

  it('accepts SHIPPED', () => {
    expect(updateOrderStatusSchema.parse({ status: 'SHIPPED' })).toEqual({ status: 'SHIPPED' });
  });

  it('accepts CANCELLED', () => {
    expect(updateOrderStatusSchema.parse({ status: 'CANCELLED' })).toEqual({ status: 'CANCELLED' });
  });

  it('rejects unknown status', () => {
    expect(() => updateOrderStatusSchema.parse({ status: 'DELIVERED' })).toThrow();
  });

  it('rejects missing status', () => {
    expect(() => updateOrderStatusSchema.parse({})).toThrow();
  });
});

describe('createProductSchema', () => {
  const valid = { slug: 'meter-podu', title: 'Meter Podu', tamil: 'மீட்டர் போடு', tag: 'SIGNBOARD', base: 499, sub: 'For the auto ride.' };

  it('accepts valid input', () => {
    expect(createProductSchema.parse(valid)).toMatchObject(valid);
  });

  it('accepts with active flag', () => {
    expect(createProductSchema.parse({ ...valid, active: false })).toMatchObject({ ...valid, active: false });
  });

  it('rejects missing required field', () => {
    const { slug: _slug, ...rest } = valid;
    expect(() => createProductSchema.parse(rest)).toThrow();
  });

  it('rejects non-positive base price', () => {
    expect(() => createProductSchema.parse({ ...valid, base: -1 })).toThrow();
  });

  it('rejects empty slug', () => {
    expect(() => createProductSchema.parse({ ...valid, slug: '' })).toThrow();
  });
});

describe('updateProductSchema', () => {
  it('accepts empty object (all optional)', () => {
    expect(updateProductSchema.parse({})).toEqual({});
  });

  it('accepts partial update', () => {
    expect(updateProductSchema.parse({ title: 'New Title' })).toEqual({ title: 'New Title' });
  });

  it('accepts active boolean', () => {
    expect(updateProductSchema.parse({ active: true })).toEqual({ active: true });
  });

  it('rejects invalid base', () => {
    expect(() => updateProductSchema.parse({ base: -5 })).toThrow();
  });
});
