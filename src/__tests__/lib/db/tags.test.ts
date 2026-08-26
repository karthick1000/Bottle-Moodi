import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import {
  getAllTags, createTag, updateTag, deleteTag, countProductsWithTag,
} from '@/lib/db/tags';

const mockTag = { id: 1, label: 'SIGNBOARD', position: 0 };

beforeEach(() => { vi.clearAllMocks(); });

describe('getAllTags', () => {
  it('orders by position then id so the chip row is stable', async () => {
    vi.mocked(prisma.tag.findMany).mockResolvedValue([mockTag] as never);
    const result = await getAllTags();
    expect(result).toEqual([mockTag]);
    expect(prisma.tag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: [{ position: 'asc' }, { id: 'asc' }] })
    );
  });
});

describe('createTag', () => {
  it('appends after the current last position', async () => {
    vi.mocked(prisma.tag.findFirst).mockResolvedValue({ position: 3 } as never);
    vi.mocked(prisma.tag.create).mockResolvedValue(mockTag as never);
    await createTag('NEW');
    expect(prisma.tag.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { label: 'NEW', position: 4 } })
    );
  });

  it('starts at position 0 when there are no tags yet', async () => {
    vi.mocked(prisma.tag.findFirst).mockResolvedValue(null as never);
    vi.mocked(prisma.tag.create).mockResolvedValue(mockTag as never);
    await createTag('FIRST');
    expect(prisma.tag.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { label: 'FIRST', position: 0 } })
    );
  });
});

describe('cache invalidation', () => {
  it('busts products too, since a poster embeds its tag label', async () => {
    vi.mocked(prisma.tag.update).mockResolvedValue(mockTag as never);
    await updateTag(1, { label: 'RENAMED' });
    expect(revalidateTag).toHaveBeenCalledWith('tags');
    expect(revalidateTag).toHaveBeenCalledWith('products');
  });
});

describe('deleteTag', () => {
  it('deletes the tag only — posters are untagged by the FK, not removed', async () => {
    vi.mocked(prisma.tag.delete).mockResolvedValue(mockTag as never);
    await deleteTag(1);
    expect(prisma.tag.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(prisma.product.delete).not.toHaveBeenCalled();
  });
});

describe('countProductsWithTag', () => {
  it('counts posters carrying the tag', async () => {
    vi.mocked(prisma.product.count).mockResolvedValue(3 as never);
    expect(await countProductsWithTag(1)).toBe(3);
    expect(prisma.product.count).toHaveBeenCalledWith({ where: { tagId: 1 } });
  });
});
