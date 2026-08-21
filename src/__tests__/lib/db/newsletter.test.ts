import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { subscribeEmail, getSubscribers } from '@/lib/db/newsletter';

const mockSubscriber = { id: 1, email: 'test@example.com', createdAt: new Date() };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('subscribeEmail', () => {
  it('creates a new subscriber and returns alreadySubscribed: false', async () => {
    vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.newsletterSubscriber.create).mockResolvedValue(mockSubscriber);
    const result = await subscribeEmail('test@example.com');
    expect(result).toEqual({ alreadySubscribed: false });
    expect(prisma.newsletterSubscriber.create).toHaveBeenCalledWith({
      data: { email: 'test@example.com' },
    });
  });

  it('returns alreadySubscribed: true when email exists', async () => {
    vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue(mockSubscriber);
    const result = await subscribeEmail('test@example.com');
    expect(result).toEqual({ alreadySubscribed: true });
    expect(prisma.newsletterSubscriber.create).not.toHaveBeenCalled();
  });

  it('checks by email uniqueness', async () => {
    vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.newsletterSubscriber.create).mockResolvedValue(mockSubscriber);
    await subscribeEmail('new@example.com');
    expect(prisma.newsletterSubscriber.findUnique).toHaveBeenCalledWith({
      where: { email: 'new@example.com' },
      select: { id: true },
    });
  });
});

describe('getSubscribers', () => {
  it('returns all subscribers ordered by createdAt desc', async () => {
    vi.mocked(prisma.newsletterSubscriber.findMany).mockResolvedValue([mockSubscriber]);
    const result = await getSubscribers();
    expect(result).toEqual([mockSubscriber]);
    expect(prisma.newsletterSubscriber.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
  });
});
