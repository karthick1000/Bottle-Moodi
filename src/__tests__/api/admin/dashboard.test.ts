import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/admin/dashboard/route';

function makeReq(): NextRequest {
  return new NextRequest('http://localhost/api/admin/dashboard', { method: 'GET' });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_CLERK_USER_ID = 'admin_user';
  vi.mocked(auth).mockResolvedValue({ userId: 'admin_user' } as never);
});

afterEach(() => {
  delete process.env.ADMIN_CLERK_USER_ID;
});

describe('GET /api/admin/dashboard', () => {
  it('returns 403 when not admin', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'other_user' } as never);
    const res = await GET(makeReq());
    expect(res.status).toBe(403);
  });

  it('returns correct response shape with mocked DB', async () => {
    // Mock recent orders
    vi.mocked(prisma.order.findMany).mockResolvedValue([
      {
        id: 1,
        createdAt: new Date(),
        status: 'PENDING',
        items: [{ amount: 499, productId: 1 }],
      },
    ] as never);

    // Mock orderItem.findMany for total units sold
    vi.mocked(prisma.orderItem.findMany).mockResolvedValue([{ id: 1 }, { id: 2 }] as never);

    // Mock orderItem.groupBy for top prints
    vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([
      { productId: 1, _count: { id: 5 } },
    ] as never);

    // Mock product.findMany for product names
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: 1, title: 'Meter Podu' },
    ] as never);

    // Mock order.groupBy for status pie
    vi.mocked(prisma.order.groupBy).mockResolvedValue([
      { status: 'PENDING', _count: { id: 1 } },
    ] as never);

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const json = await res.json();

    // Verify response shape
    expect(typeof json.revenue30d).toBe('number');
    expect(typeof json.orders30d).toBe('number');
    expect(typeof json.unitsSold).toBe('number');
    expect(typeof json.avgOrder).toBe('number');
    expect(Array.isArray(json.revenueChart)).toBe(true);
    expect(Array.isArray(json.weeklyBars)).toBe(true);
    expect(Array.isArray(json.topPrints)).toBe(true);
    expect(Array.isArray(json.statusPie)).toBe(true);
  });

  it('revenueChart has 30 entries', async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.orderItem.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([] as never);
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.order.groupBy).mockResolvedValue([] as never);

    const res = await GET(makeReq());
    const json = await res.json();
    expect(json.revenueChart).toHaveLength(30);
  });

  it('weeklyBars has 7 entries with day names', async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.orderItem.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([] as never);
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.order.groupBy).mockResolvedValue([] as never);

    const res = await GET(makeReq());
    const json = await res.json();
    expect(json.weeklyBars).toHaveLength(7);
    const days = json.weeklyBars.map((b: { day: string }) => b.day);
    expect(days).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('avgOrder is 0 when no orders', async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.orderItem.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([] as never);
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.order.groupBy).mockResolvedValue([] as never);

    const res = await GET(makeReq());
    const json = await res.json();
    expect(json.avgOrder).toBe(0);
    expect(json.orders30d).toBe(0);
    expect(json.revenue30d).toBe(0);
  });

  it('calculates revenue and avgOrder correctly', async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([
      { id: 1, createdAt: new Date(), status: 'PAID', items: [{ amount: 500, productId: 1 }, { amount: 300, productId: 2 }] },
      { id: 2, createdAt: new Date(), status: 'PENDING', items: [{ amount: 400, productId: 1 }] },
    ] as never);
    vi.mocked(prisma.orderItem.findMany).mockResolvedValue([{ id: 1 }] as never);
    vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([] as never);
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.order.groupBy).mockResolvedValue([] as never);

    const res = await GET(makeReq());
    const json = await res.json();
    expect(json.revenue30d).toBe(1200); // 500+300+400
    expect(json.orders30d).toBe(2);
    expect(json.avgOrder).toBe(600); // 1200/2
  });

  it('statusPie maps order statuses correctly', async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.orderItem.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([] as never);
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.order.groupBy).mockResolvedValue([
      { status: 'PENDING', _count: { id: 3 } },
      { status: 'SHIPPED', _count: { id: 7 } },
    ] as never);

    const res = await GET(makeReq());
    const json = await res.json();
    expect(json.statusPie).toHaveLength(2);
    const pending = json.statusPie.find((s: { name: string }) => s.name === 'PENDING');
    expect(pending?.value).toBe(3);
  });
});
