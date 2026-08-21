import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  getUserCart,
  addOrUpdateCartItem,
  removeCartItem,
  clearUserCart,
} from '@/lib/db/cart';

const mockCartItem = {
  id: 1, clerkUserId: 'user_1', productId: 1, size: 'A3', amount: 649, createdAt: new Date(),
  product: { slug: 'meter-podu', title: 'Meter Podu', tamil: 'மீட்டர் போடு' },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getUserCart', () => {
  it('returns cart items for a user', async () => {
    vi.mocked(prisma.cartItem.findMany).mockResolvedValue([mockCartItem] as never);
    const result = await getUserCart('user_1');
    expect(result).toEqual([mockCartItem]);
    expect(prisma.cartItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clerkUserId: 'user_1' } })
    );
  });

  it('returns empty array for unknown user', async () => {
    vi.mocked(prisma.cartItem.findMany).mockResolvedValue([]);
    const result = await getUserCart('user_unknown');
    expect(result).toEqual([]);
  });
});

describe('addOrUpdateCartItem', () => {
  it('upserts a cart item and returns it', async () => {
    vi.mocked(prisma.cartItem.upsert).mockResolvedValue(mockCartItem as never);
    const result = await addOrUpdateCartItem('user_1', 1, 'A3', 649);
    expect(result).toEqual(mockCartItem);
    expect(prisma.cartItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clerkUserId_productId_size: { clerkUserId: 'user_1', productId: 1, size: 'A3' } },
        create: { clerkUserId: 'user_1', productId: 1, size: 'A3', amount: 649 },
        update: { amount: 649 },
      })
    );
  });
});

describe('removeCartItem', () => {
  it('calls deleteMany with id and clerkUserId (ownership check)', async () => {
    vi.mocked(prisma.cartItem.deleteMany).mockResolvedValue({ count: 1 });
    await removeCartItem(1, 'user_1');
    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { id: 1, clerkUserId: 'user_1' },
    });
  });
});

describe('clearUserCart', () => {
  it('deletes all items for a user', async () => {
    vi.mocked(prisma.cartItem.deleteMany).mockResolvedValue({ count: 3 });
    await clearUserCart('user_1');
    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { clerkUserId: 'user_1' },
    });
  });
});
