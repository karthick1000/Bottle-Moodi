"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { money, SHIPPING, SIZE_UPCHARGE, type Size } from "./data";

export interface CartItem {
  productId: number;
  title: string;
  tamil: string;
  size: Size;
  base: number;
  amount: number;
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
  subtotal: () => number;
  total: () => number;
  shippingCost: () => number;
  formattedSubtotal: () => string;
  formattedTotal: () => string;
  formattedShipping: () => string;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartOpen: false,

      addItem: (item) => {
        const amount = item.base + SIZE_UPCHARGE[item.size];
        set((s) => ({ items: [...s.items, { ...item, amount }] }));
      },

      removeItem: (index) =>
        set((s) => ({ items: s.items.filter((_, i) => i !== index) })),

      clearCart: () => set({ items: [] }),

      toggleCart: () => set((s) => ({ cartOpen: !s.cartOpen })),
      openCart: () => set({ cartOpen: true }),
      closeCart: () => set({ cartOpen: false }),

      subtotal: () => get().items.reduce((s, c) => s + c.amount, 0),
      shippingCost: () => (get().items.length > 0 ? SHIPPING : 0),
      total: () => get().subtotal() + get().shippingCost(),

      formattedSubtotal: () => money(get().subtotal()),
      formattedShipping: () => money(get().shippingCost()),
      formattedTotal: () => money(get().total()),
    }),
    { name: "bm-cart", partialize: (s) => ({ items: s.items }) }
  )
);
