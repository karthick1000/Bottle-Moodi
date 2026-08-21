import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  getUserOrders,
  getAllOrders,
  createOrder,
  updateOrderStatus,
} from '@/lib/db/orders';
import { OrderStatus } from '@prisma/client';

const mockOrder = {
  id: 1, clerkUserId: 'user_1', status: OrderStatus.PENDING, shipping: 79,
  createdAt: new Date(),
  items: [
    { id: 1, orderId: 1, productId: 1, size: 'A3', amount: 649,
      product: { title: 'Meter Podu', tamil: 'மீட்டர் போடு' } },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getUserOrders', () => {
  it('returns orders for a user', async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([mockOrder] as never);
    const result = await getUserOrders('user_1');
    expect(result).toEqual([mockOrder]);
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clerkUserId: 'user_1' } })
    );
  });
});

describe('getAllOrders', () => {
  it('returns all orders without a filter', async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([mockOrder] as never);
    const result = await getAllOrders();
    expect(result).toEqual([mockOrder]);
    const call = vi.mocked(prisma.order.findMany).mock.calls[0][0];
    expect(call).not.toHaveProperty('where');
  });
});

describe('createOrder', () => {
  it('creates an order with items', async () => {
    vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as never);
    const items = [{ productId: 1, size: 'A3', amount: 649 }];
    const result = await createOrder('user_1', items);
    expect(result).toEqual(mockOrder);
    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clerkUserId: 'user_1',
          shipping: 79,
          items: { create: items },
        }),
      })
    );
  });

  it('accepts custom shipping', async () => {
    vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as never);
    await createOrder('user_1', [{ productId: 1, size: 'A3', amount: 649 }], 150);
    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ shipping: 150 }),
      })
    );
  });
});

describe('updateOrderStatus', () => {
  it('updates the status and returns order', async () => {
    const updated = { ...mockOrder, status: OrderStatus.SHIPPED };
    vi.mocked(prisma.order.update).mockResolvedValue(updated as never);
    const result = await updateOrderStatus(1, OrderStatus.SHIPPED);
    expect(result.status).toBe(OrderStatus.SHIPPED);
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 }, data: { status: OrderStatus.SHIPPED } })
    );
  });
});
