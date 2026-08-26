"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/store";
import type { ShippingRule } from "@/lib/data";

/**
 * Pushes server-read config into the cart store on mount.
 *
 * The delivery rule lives in SiteSetting, but the cart totals are computed in
 * a zustand store that React context can't reach. The site layout is a server
 * component, so it reads the rule from the cached settings and hands it down
 * here — no client fetch, and every surface that shows delivery (cart drawer,
 * checkout) agrees with what the order routes will charge.
 */
export function ConfigSync({ shipping }: { shipping: ShippingRule }) {
  const setShippingRule = useCartStore((s) => s.setShippingRule);

  useEffect(() => {
    setShippingRule(shipping);
  }, [shipping.fee, shipping.freeAbove, setShippingRule]);

  return null;
}
