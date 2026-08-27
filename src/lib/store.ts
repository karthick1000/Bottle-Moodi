"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  money, shippingFor, SHIPPING_DEFAULTS, type ShippingRule, type Size,
} from "./data";

export interface CartItem {
  id?: number; // DB row id — present after sync, absent for guest/local items
  productId: number;
  title: string;
  tamil: string;
  size: Size;
  /** Unit price for this size, resolved by the caller from the product's own prices. */
  amount: number;
  qty: number;
  image?: string;
}

// Shape returned by GET /api/cart
export interface DbCartItem {
  id: number;
  productId: number;
  size: string;
  amount: number;
  qty: number;
  product: { slug: string; title: string; tamil: string; image?: string };
}

interface CartStore {
  items: CartItem[];
  cartOpen: boolean;
  /**
   * The admin's delivery rule. Seeded with the defaults so the first paint is
   * sane, then replaced once ConfigSync passes down what the server read.
   */
  shippingRule: ShippingRule;
  setShippingRule: (rule: ShippingRule) => void;
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (index: number) => void;
  setQty: (index: number, qty: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  syncCartFromDb: (dbItems: DbCartItem[]) => void;
  /** Rewrite line prices from a server quote. Returns true if anything moved. */
  applyQuotePrices: (lines: { productId: number; size: string; unitPrice: number }[]) => boolean;
  subtotal: () => number;
  total: () => number;
  shippingCost: () => number;
  formattedSubtotal: () => string;
  formattedTotal: () => string;
  formattedShipping: () => string;
  authOpen: boolean;
  authMode: "login" | "signup";
  openLogin: () => void;
  openSignup: () => void;
  closeAuth: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartOpen: false,
      shippingRule: SHIPPING_DEFAULTS,
      authOpen: false,
      authMode: "login" as "login" | "signup",

      addItem: (item) => {
        set((s) => {
          const idx = s.items.findIndex(
            (x) => x.productId === item.productId && x.size === item.size
          );
          if (idx !== -1) {
            const items = s.items.map((x, i) =>
              i === idx ? { ...x, qty: x.qty + 1 } : x
            );
            return { items };
          }
          return { items: [...s.items, { ...item, qty: 1 }] };
        });
      },

      setShippingRule: (rule) => set({ shippingRule: rule }),

      removeItem: (index) =>
        set((s) => ({ items: s.items.filter((_, i) => i !== index) })),

      setQty: (index, qty) => {
        if (qty <= 0) {
          set((s) => ({ items: s.items.filter((_, i) => i !== index) }));
        } else {
          set((s) => ({
            items: s.items.map((x, i) => (i === index ? { ...x, qty } : x)),
          }));
        }
      },

      clearCart: () => set({ items: [] }),

      toggleCart: () => set((s) => ({ cartOpen: !s.cartOpen })),
      openCart: () => set({ cartOpen: true }),
      closeCart: () => set({ cartOpen: false }),

      syncCartFromDb: (dbItems) => {
        const synced: CartItem[] = dbItems.map((d) => ({
          id: d.id, // preserve DB row id so DELETE can reference it
          productId: d.productId,
          title: d.product.title,
          tamil: d.product.tamil,
          size: d.size as Size,
          amount: d.amount,
          qty: d.qty,
          image: d.product.image,
        }));
        set({ items: synced });
      },

      applyQuotePrices: (lines) => {
        const priced = new Map(lines.map((l) => [`${l.productId}:${l.size}`, l.unitPrice]));
        let changed = false;
        const items = get().items.map((item) => {
          const fresh = priced.get(`${item.productId}:${item.size}`);
          if (fresh === undefined || fresh === item.amount) return item;
          changed = true;
          return { ...item, amount: fresh };
        });
        if (changed) set({ items });
        return changed;
      },

      subtotal: () => get().items.reduce((s, c) => s + c.amount * c.qty, 0),
      shippingCost: () => shippingFor(get().subtotal(), get().shippingRule),
      total: () => get().subtotal() + get().shippingCost(),

      formattedSubtotal: () => money(get().subtotal()),
      formattedShipping: () => money(get().shippingCost()),
      formattedTotal: () => money(get().total()),

      openLogin: () => set({ authOpen: true, authMode: "login" }),
      openSignup: () => set({ authOpen: true, authMode: "signup" }),
      closeAuth: () => set({ authOpen: false }),
    }),
    { name: "bm-cart", partialize: (s) => ({ items: s.items }) }
  )
);
