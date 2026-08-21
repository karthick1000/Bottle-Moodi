import { vi } from 'vitest';

// Mock the prisma singleton so no real DB calls happen
vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    orderItem: {
      createMany: vi.fn(),
    },
    cartItem: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    newsletterSubscriber: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  unstable_cache: (fn: unknown) => fn,
}));

// Mock @clerk/nextjs/server
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));
