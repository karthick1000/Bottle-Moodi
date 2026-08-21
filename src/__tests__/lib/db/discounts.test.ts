import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  validateDiscountCode,
  getAllDiscountCodes,
  createDiscountCode,
  incrementUsedCount,
} from '@/lib/db/discounts';

const now = new Date();
const future = new Date(now.getTime() + 86400000); // +1 day
const past   = new Date(now.getTime() - 86400000); // -1 day

function makeCode(overrides: Partial<{
  id: number; code: string; type: string; value: number;
  minOrder: number | null; maxUses: number | null; usedCount: number;
  active: boolean; expiresAt: Date | null; createdAt: Date;
}> = {}) {
  return {
    id: 1,
    code: 'TEST10',
    type: 'PERCENT',
    value: 10,
    minOrder: null,
    maxUses: null,
    usedCount: 0,
    active: true,
    expiresAt: null,
    createdAt: now,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── validateDiscountCode ────────────────────────────────────────────────────

describe('validateDiscountCode', () => {
  it('returns invalid when code not found', async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(null);
    const result = await validateDiscountCode('BADCODE', 500);
    expect(result.valid).toBe(false);
    expect(result.discountAmount).toBe(0);
  });

  it('returns invalid when code is inactive', async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(makeCode({ active: false }) as never);
    const result = await validateDiscountCode('TEST10', 500);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/active/i);
  });

  it('returns invalid when code is expired', async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(makeCode({ expiresAt: past }) as never);
    const result = await validateDiscountCode('TEST10', 500);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/expired/i);
  });

  it('returns invalid when maxUses reached', async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(
      makeCode({ maxUses: 5, usedCount: 5 }) as never
    );
    const result = await validateDiscountCode('TEST10', 500);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/usage limit/i);
  });

  it('returns invalid when minOrder not met', async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(
      makeCode({ minOrder: 1000 }) as never
    );
    const result = await validateDiscountCode('TEST10', 500);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/minimum order/i);
  });

  it('calculates PERCENT discount correctly', async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(
      makeCode({ type: 'PERCENT', value: 10 }) as never
    );
    const result = await validateDiscountCode('TEST10', 500);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(50); // 10% of 500
    expect(result.type).toBe('PERCENT');
  });

  it('calculates FLAT discount correctly', async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(
      makeCode({ type: 'FLAT', value: 100 }) as never
    );
    const result = await validateDiscountCode('TEST10', 500);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(100);
    expect(result.type).toBe('FLAT');
  });

  it('caps FLAT discount at order total', async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(
      makeCode({ type: 'FLAT', value: 1000 }) as never
    );
    const result = await validateDiscountCode('TEST10', 500);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(500); // capped at orderTotal
  });

  it('uses Math.floor for PERCENT rounding', async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(
      makeCode({ type: 'PERCENT', value: 10 }) as never
    );
    const result = await validateDiscountCode('TEST10', 333);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(33); // Math.floor(333*10/100) = 33
  });

  it('accepts a code with a future expiry', async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(
      makeCode({ expiresAt: future }) as never
    );
    const result = await validateDiscountCode('TEST10', 500);
    expect(result.valid).toBe(true);
  });

  it('accepts a code with usedCount below maxUses', async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(
      makeCode({ maxUses: 10, usedCount: 9 }) as never
    );
    const result = await validateDiscountCode('TEST10', 500);
    expect(result.valid).toBe(true);
  });
});

// ── getAllDiscountCodes ──────────────────────────────────────────────────────

describe('getAllDiscountCodes', () => {
  it('returns all discount codes ordered by createdAt desc', async () => {
    const codes = [makeCode({ id: 2 }), makeCode({ id: 1 })];
    vi.mocked(prisma.discountCode.findMany).mockResolvedValue(codes as never);
    const result = await getAllDiscountCodes();
    expect(result).toEqual(codes);
    expect(prisma.discountCode.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } })
    );
  });
});

// ── createDiscountCode ──────────────────────────────────────────────────────

describe('createDiscountCode', () => {
  it('creates a PERCENT code and uppercases it', async () => {
    const created = makeCode();
    vi.mocked(prisma.discountCode.create).mockResolvedValue(created as never);
    const result = await createDiscountCode({ code: 'test10', type: 'PERCENT', value: 10 });
    expect(result).toEqual(created);
    expect(prisma.discountCode.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ code: 'TEST10', type: 'PERCENT', value: 10 }),
      })
    );
  });

  it('creates a FLAT code with all optional fields', async () => {
    const created = makeCode({ type: 'FLAT', value: 100, minOrder: 500, maxUses: 50 });
    vi.mocked(prisma.discountCode.create).mockResolvedValue(created as never);
    const result = await createDiscountCode({
      code: 'FLAT100',
      type: 'FLAT',
      value: 100,
      minOrder: 500,
      maxUses: 50,
      active: true,
      expiresAt: future.toISOString(),
    });
    expect(result).toEqual(created);
  });
});

// ── incrementUsedCount ──────────────────────────────────────────────────────

describe('incrementUsedCount', () => {
  it('increments usedCount by 1', async () => {
    vi.mocked(prisma.discountCode.update).mockResolvedValue(makeCode({ usedCount: 1 }) as never);
    await incrementUsedCount(1);
    expect(prisma.discountCode.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { usedCount: { increment: 1 } },
    });
  });
});
