import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  getAllProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/db/products';

const mockProduct = {
  id: 1, slug: 'meter-podu', title: 'Meter Podu', tamil: 'மீட்டர் போடு',
  tag: 'SIGNBOARD', base: 499, sub: 'Test sub.', active: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getAllProducts', () => {
  it('returns products with activeOnly=true', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as never);
    const result = await getAllProducts(true);
    expect(result).toEqual([mockProduct]);
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true } })
    );
  });

  it('returns all products with activeOnly=false', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as never);
    const result = await getAllProducts(false);
    expect(result).toEqual([mockProduct]);
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    );
  });

  it('defaults to activeOnly=true', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as never);
    await getAllProducts();
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true } })
    );
  });
});

describe('getProductBySlug', () => {
  it('returns a product when found', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as never);
    const result = await getProductBySlug('meter-podu');
    expect(result).toEqual(mockProduct);
    expect(prisma.product.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'meter-podu' } })
    );
  });

  it('returns null when not found', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
    const result = await getProductBySlug('nonexistent');
    expect(result).toBeNull();
  });
});

describe('createProduct', () => {
  it('creates and returns a product', async () => {
    vi.mocked(prisma.product.create).mockResolvedValue(mockProduct as never);
    const data = { slug: 'meter-podu', title: 'Meter Podu', tamil: 'மீட்டர் போடு', tag: 'SIGNBOARD', base: 499, sub: 'Test.' };
    const result = await createProduct(data);
    expect(result).toEqual(mockProduct);
    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({ data })
    );
  });
});

describe('updateProduct', () => {
  it('updates and returns the product', async () => {
    const updated = { ...mockProduct, title: 'Updated Title' };
    vi.mocked(prisma.product.update).mockResolvedValue(updated as never);
    const result = await updateProduct(1, { title: 'Updated Title' });
    expect(result).toEqual(updated);
    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 }, data: { title: 'Updated Title' } })
    );
  });
});

describe('deleteProduct', () => {
  it('calls prisma.product.delete with correct id', async () => {
    vi.mocked(prisma.product.delete).mockResolvedValue(mockProduct as never);
    await deleteProduct(1);
    expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
