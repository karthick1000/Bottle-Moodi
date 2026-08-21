import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/discounts/validate/route';

function makeReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/discounts/validate', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const now = new Date();

function makeCode(overrides: Partial<{
  id: number; code: string; type: string; value: number;
  minOrder: number | null; maxUses: number | null; usedCount: number;
  active: boolean; expiresAt: Date | null; createdAt: Date;
}> = {}) {
  return {
    id: 1, code: 'SAVE10', type: 'PERCENT', value: 10,
    minOrder: null, maxUses: null, usedCount: 0,
    active: true, expiresAt: null, createdAt: now,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/discounts/validate', () => {
  it('returns valid:true and discountAmount for a valid PERCENT code', async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(makeCode() as never);
    const res = await POST(makeReq({ code: 'SAVE10', orderTotal: 500 }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.valid).toBe(true);
    expect(json.discountAmount).toBe(50);
    expect(json.type).toBe('PERCENT');
  });

  it('returns valid:false with a message for an invalid code', async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(null);
    const res = await POST(makeReq({ code: 'BADCODE', orderTotal: 500 }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.valid).toBe(false);
    expect(json.discountAmount).toBe(0);
    expect(json.message).toBeTruthy();
  });

  it('returns valid:false when code is inactive', async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(makeCode({ active: false }) as never);
    const res = await POST(makeReq({ code: 'SAVE10', orderTotal: 500 }));
    const json = await res.json();
    expect(json.valid).toBe(false);
  });

  it('returns 400 when code field is missing', async () => {
    const res = await POST(makeReq({ orderTotal: 500 }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when orderTotal is missing', async () => {
    const res = await POST(makeReq({ code: 'SAVE10' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when orderTotal is negative', async () => {
    const res = await POST(makeReq({ code: 'SAVE10', orderTotal: -1 }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty body', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it('returns valid:true with discountAmount for a FLAT code', async () => {
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(makeCode({ type: 'FLAT', value: 100 }) as never);
    const res = await POST(makeReq({ code: 'FLAT100', orderTotal: 600 }));
    const json = await res.json();
    expect(json.valid).toBe(true);
    expect(json.discountAmount).toBe(100);
  });
});
