"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useCartStore, type DbCartItem } from "@/lib/store";

export function CartSync() {
  const { isSignedIn, isLoaded } = useAuth();
  const { items, syncCartFromDb, clearCart } = useCartStore();
  const prevSignedIn = useRef<boolean | null>(null);

  // Sync from DB when user signs in
  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && prevSignedIn.current !== true) {
      prevSignedIn.current = true;
      fetch("/api/cart")
        .then((r) => r.json())
        .then((data: DbCartItem[]) => {
          if (Array.isArray(data)) syncCartFromDb(data);
        })
        .catch(() => {});
    }

    if (!isSignedIn && prevSignedIn.current === true) {
      prevSignedIn.current = false;
      clearCart();
    }

    if (!isSignedIn) prevSignedIn.current = false;
  }, [isSignedIn, isLoaded, syncCartFromDb, clearCart]);

  // Debounce-sync all local items to DB when signed in
  useEffect(() => {
    if (!isSignedIn) return;
    const timer = setTimeout(() => {
      items.forEach((item) => {
        fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: item.productId,
            size: item.size,
            amount: item.amount,
          }),
        }).catch(() => {});
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [items, isSignedIn]);

  return null;
}
