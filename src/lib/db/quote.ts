import { prisma } from "@/lib/prisma";
import { priceFor, shippingFor, type Size } from "@/lib/data";
import { getShippingRule } from "@/lib/db/settings";
import { validateDiscountCode } from "@/lib/db/discounts";

/**
 * The single server-side answer to "what does this cart cost?".
 *
 * Every path that takes money or writes an Order goes through here, so the
 * amount a customer is charged, the amount recorded against the order, and
 * the delivery rule applied can never disagree with each other. Nothing the
 * client sends about money is read — only which product, in which size.
 */

export interface QuoteRequestItem {
  productId: number;
  size: string;
  qty: number;
}

export interface QuoteLine {
  productId: number;
  size: string;
  qty: number;
  /** Current price of this product in this size, straight from the DB. */
  unitPrice: number;
}

export interface Quote {
  lines: QuoteLine[];
  subtotal: number;
  shipping: number;
  discountAmount: number;
  /** Set only when a code validated; the caller increments its use count. */
  discountId?: number;
  total: number;
}

/** A product in the cart is gone or archived — a 400, not a 500. */
export class UnavailableProductError extends Error {
  constructor() {
    super("One or more products are unavailable");
    this.name = "UnavailableProductError";
  }
}

export async function quoteOrder(
  items: QuoteRequestItem[],
  discountCode?: string
): Promise<Quote> {
  const productIds = [...new Set(items.map((i) => i.productId))];

  // Independent reads — the price lookup and the delivery rule don't need
  // each other, so don't pay for them in series.
  const [products, shippingRule] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
      select: { id: true, base: true, priceA3: true, priceA2: true },
    }),
    getShippingRule(),
  ]);

  if (products.length !== productIds.length) throw new UnavailableProductError();
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: QuoteLine[] = items.map((i) => ({
    productId: i.productId,
    size:      i.size,
    qty:       Math.max(1, i.qty),
    unitPrice: priceFor(byId.get(i.productId)!, i.size as Size),
  }));

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const shipping = shippingFor(subtotal, shippingRule);

  let discountAmount = 0;
  let discountId: number | undefined;
  if (discountCode) {
    const validation = await validateDiscountCode(discountCode, subtotal);
    if (validation.valid) {
      discountAmount = validation.discountAmount;
      discountId     = validation.discountId;
    }
  }

  return {
    lines,
    subtotal,
    shipping,
    discountAmount,
    discountId,
    // Delivery is charged on top of the discounted goods, never discounted.
    total: Math.max(0, subtotal - discountAmount) + shipping,
  };
}

/** OrderItem rows for a quote. `amount` is the line total (unitPrice × qty). */
export function quoteToOrderItems(quote: Quote) {
  return quote.lines.map((l) => ({
    productId: l.productId,
    size:      l.size,
    amount:    l.unitPrice * l.qty,
    unitPrice: l.unitPrice,
  }));
}
