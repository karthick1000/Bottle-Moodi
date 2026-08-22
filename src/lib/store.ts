"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { money, SHIPPING, SIZE_UPCHARGE, type Size } from "./data";

export interface CartItem {
  id?: number; // DB row id — present after sync, absent for guest/local items
  productId: number;
  title: string;
  tamil: string;
  size: Size;
  base: number;
  amount: number;
}

// Shape returned by GET /api/cart
export interface DbCartItem {
  id: number;
  productId: number;
  size: string;
  amount: number;
  product: { slug: string; title: string; tamil: string };
}

interface CartStore {
  items: CartItem[];
  cartOpen: boolean;
  addItem: (item: Omit<CartItem, "amount">) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  syncCartFromDb: (dbItems: DbCartItem[]) => void;
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
      authOpen: false,
      authMode: "login" as "login" | "signup",

      addItem: (item) => {
        const amount = item.base + SIZE_UPCHARGE[item.size];
        set((s) => {
          // Honour the DB's unique constraint: one row per (productId, size)
          const exists = s.items.some(
            (x) => x.productId === item.productId && x.size === item.size
          );
          if (exists) return s;
          return { items: [...s.items, { ...item, amount }] };
        });
      },

      removeItem: (index) =>
        set((s) => ({ items: s.items.filter((_, i) => i !== index) })),

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
          base: d.amount,
          amount: d.amount,
        }));
        set({ items: synced });
      },

      subtotal: () => get().items.reduce((s, c) => s + c.amount, 0),
      shippingCost: () => (get().items.length > 0 ? SHIPPING : 0),
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
