import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAuthUserId, getAdminUserId, jsonOk, jsonErr, parseBody } from '@/lib/apiHelpers';
import { z } from 'zod';

function makeReq(body?: unknown, url = 'http://localhost/api/test'): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.ADMIN_CLERK_USER_ID;
});

describe('jsonOk', () => {
  it('returns status 200 with the data', async () => {
    const res = jsonOk({ hello: 'world' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ hello: 'world' });
  });
});

describe('jsonErr', () => {
  it('returns the given status with error message', async () => {
    const res = jsonErr('Not found', 404);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json).toEqual({ error: 'Not found' });
  });

  it('returns 500 with error message', async () => {
    const res = jsonErr('Server error', 500);
    expect(res.status).toBe(500);
  });
});

describe('getAuthUserId', () => {
  it('returns the userId when signed in', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as never);
    const req = makeReq();
    const userId = await getAuthUserId(req);
    expect(userId).toBe('user_123');
  });

  it('throws a 401 Response when not signed in', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    const req = makeReq();
    await expect(getAuthUserId(req)).rejects.toBeInstanceOf(Response);
    try {
      await getAuthUserId(req);
    } catch (res) {
      expect((res as Response).status).toBe(401);
    }
  });
});

describe('getAdminUserId', () => {
  it('returns the userId when user is the admin', async () => {
    process.env.ADMIN_CLERK_USER_ID = 'admin_user';
    vi.mocked(auth).mockResolvedValue({ userId: 'admin_user' } as never);
    const req = makeReq();
    const userId = await getAdminUserId(req);
    expect(userId).toBe('admin_user');
  });

  it('throws 403 when user is not the admin', async () => {
    process.env.ADMIN_CLERK_USER_ID = 'admin_user';
    vi.mocked(auth).mockResolvedValue({ userId: 'other_user' } as never);
    const req = makeReq();
    await expect(getAdminUserId(req)).rejects.toBeInstanceOf(Response);
    try {
      await getAdminUserId(req);
    } catch (res) {
      expect((res as Response).status).toBe(403);
    }
  });

  it('throws 403 when ADMIN_CLERK_USER_ID is not set', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as never);
    const req = makeReq();
    await expect(getAdminUserId(req)).rejects.toBeInstanceOf(Response);
  });

  it('throws 401 when user is not signed in', async () => {
    process.env.ADMIN_CLERK_USER_ID = 'admin_user';
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    const req = makeReq();
    await expect(getAdminUserId(req)).rejects.toBeInstanceOf(Response);
  });
});

describe('parseBody', () => {
  const schema = z.object({ name: z.string().min(1), age: z.number().int().positive() });

  it('returns parsed data for valid body', async () => {
    const req = makeReq({ name: 'Ravi', age: 25 });
    const result = await parseBody(req, schema);
    expect(result).toEqual({ name: 'Ravi', age: 25 });
  });

  it('throws 400 Response on Zod validation error', async () => {
    let caughtRes: unknown;
    try {
      await parseBody(makeReq({ name: '', age: 25 }), schema);
    } catch (res) {
      caughtRes = res;
    }
    expect(caughtRes).toBeInstanceOf(Response);
    expect((caughtRes as Response).status).toBe(400);
  });

  it('throws 400 on invalid JSON', async () => {
    const req = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    });
    await expect(parseBody(req, schema)).rejects.toBeInstanceOf(Response);
  });
});
