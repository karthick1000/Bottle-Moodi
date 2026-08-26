import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { quoteOrder, quoteToOrderItems, UnavailableProductError } from '@/lib/db/quote';
import { validateDiscountCode } from '@/lib/db/discounts';

vi.mock('@/lib/db/discounts', () => ({ validateDiscountCode: vi.fn() }));
vi.mock('@/lib/db/settings', () => ({
  getShippingRule: vi.fn(async () => ({ fee: 79, freeAbove: 999 })),
}));

const poster = { id: 1, base: 199, priceA3: 349, priceA2: 549 };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.product.findMany).mockResolvedValue([poster] as never);
});

describe('quoteOrder', () => {
  it('prices each line from the DB and ignores what the client sent', async () => {
    const quote = await quoteOrder([
      // A tampered/stale client price must have no effect on the outcome.
      { productId: 1, size: 'A3', amount: 1 } as never,
    ]);
    expect(quote.lines[0].unitPrice).toBe(349);
    expect(quote.subtotal).toBe(349);
  });

  it('sums lines rather than multiplying price by price', async () => {
    // The old code did unitPrice * amount, where amount was itself a price —
    // one A3 poster came to 349 * 349.
    const quote = await quoteOrder([{ productId: 1, size: 'A3' }]);
    expect(quote.subtotal).toBe(349);
    expect(quote.subtotal).not.toBe(349 * 349);
  });

  it('adds delivery below the free threshold', async () => {
    const quote = await quoteOrder([{ productId: 1, size: 'A4' }]);
    expect(quote.subtotal).toBe(199);
    expect(quote.shipping).toBe(79);
    expect(quote.total).toBe(278);
  });

  it('drops delivery at the threshold', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { ...poster, priceA2: 999 },
    ] as never);
    const quote = await quoteOrder([{ productId: 1, size: 'A2' }]);
    expect(quote.shipping).toBe(0);
    expect(quote.total).toBe(999);
  });

  it('discounts the goods but never the delivery', async () => {
    vi.mocked(validateDiscountCode).mockResolvedValue({
      valid: true, discountAmount: 100, discountId: 7,
    } as never);
    const quote = await quoteOrder([{ productId: 1, size: 'A4' }], 'SAVE100');
    expect(quote.discountAmount).toBe(100);
    expect(quote.discountId).toBe(7);
    expect(quote.total).toBe(199 - 100 + 79);
  });

  it('validates the discount against the real subtotal, not a client figure', async () => {
    vi.mocked(validateDiscountCode).mockResolvedValue({ valid: true, discountAmount: 0 } as never);
    await quoteOrder([{ productId: 1, size: 'A3', amount: 99999 } as never], 'CODE');
    expect(validateDiscountCode).toHaveBeenCalledWith('CODE', 349);
  });

  it('ignores a code that fails validation', async () => {
    vi.mocked(validateDiscountCode).mockResolvedValue({
      valid: false, discountAmount: 0, message: 'expired',
    } as never);
    const quote = await quoteOrder([{ productId: 1, size: 'A4' }], 'DEAD');
    expect(quote.discountAmount).toBe(0);
    expect(quote.discountId).toBeUndefined();
  });

  it('never returns a negative total when the discount exceeds the goods', async () => {
    vi.mocked(validateDiscountCode).mockResolvedValue({
      valid: true, discountAmount: 5000, discountId: 1,
    } as never);
    const quote = await quoteOrder([{ productId: 1, size: 'A4' }], 'HUGE');
    expect(quote.total).toBe(79); // delivery only, never below zero
  });

  it('rejects a cart holding an archived or missing product', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as never);
    await expect(quoteOrder([{ productId: 99, size: 'A4' }]))
      .rejects.toBeInstanceOf(UnavailableProductError);
  });

  it('only queries active products', async () => {
    await quoteOrder([{ productId: 1, size: 'A4' }]);
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: [1] }, active: true } })
    );
  });
});

describe('quoteToOrderItems', () => {
  it('records the server price on both fields the receipts read', async () => {
    const quote = await quoteOrder([{ productId: 1, size: 'A3' }]);
    expect(quoteToOrderItems(quote)).toEqual([
      { productId: 1, size: 'A3', amount: 349, unitPrice: 349 },
    ]);
  });
});
