"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { money, SHIPPING } from "@/lib/data";

interface OrderProduct {
  title: string;
  tamil: string;
}

interface OrderItem {
  id: number;
  size: string;
  amount: number;
  product: OrderProduct;
}

interface DeliveryAddress {
  name: string;
  phone: string;
  line1: string;
  city: string;
  pincode: string;
}

interface Order {
  id: number;
  status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
  shipping: number;
  createdAt: string;
  items: OrderItem[];
  address: DeliveryAddress | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#a8781a",
  PAID: "#1a5fa8",
  SHIPPED: "#2f7d55",
  CANCELLED: "#e8452c",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className="font-mono text-[10px] tracking-[.1em] px-2 py-1 rounded-sm font-semibold"
      style={{
        background: STATUS_COLORS[status] ?? "#6e6455",
        color: "#f4ecdc",
      }}
    >
      {status}
    </span>
  );
}

function OrderSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-[#d9cfb8] rounded-sm p-4 md:p-5">
          <div className="h-4 bg-[#d9cfb8] rounded w-32 mb-3" />
          <div className="h-3 bg-[#e9e0cc] rounded w-48 mb-2" />
          <div className="h-3 bg-[#e9e0cc] rounded w-40" />
        </div>
      ))}
    </div>
  );
}

export default function MyOrdersPage() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    fetch("/api/orders")
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body?.error ?? `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((data: Order[]) => {
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch((err: Error) => {
        console.error("[my-orders]", err.message);
        setFetchError(err.message ?? "Failed to load orders");
      })
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || loading) {
    return (
      <main className="max-w-[900px] mx-auto px-4 md:px-7 py-10 md:py-[52px] pb-16">
        <h1 className="font-bakbak text-[28px] md:text-[36px] mb-8">MY ORDERS</h1>
        <OrderSkeleton />
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="max-w-[900px] mx-auto px-4 md:px-7 py-10 md:py-[52px] pb-16 text-center">
        <h1 className="font-bakbak text-[28px] md:text-[36px] mb-4">MY ORDERS</h1>
        <p className="text-[15px] text-[#6e6455] mb-6">
          Please sign in to view your orders.
        </p>
        <Link
          href="/sign-in"
          className="inline-block bg-dark text-cream font-bakbak text-[14px] px-6 py-3 rounded-sm hover:bg-[#e8452c] transition-colors"
        >
          SIGN IN
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-[900px] mx-auto px-4 md:px-7 py-10 md:py-[52px] pb-16">
      <div className="flex items-end justify-between gap-4 flex-wrap border-b-[3px] border-double border-dark pb-4 md:pb-5 mb-8">
        <div>
          <span className="font-bakbak text-[11px] md:text-[12px] tracking-[.3em] text-[#e8452c]">
            ACCOUNT
          </span>
          <h1
            className="mt-2 md:mt-3 font-bakbak leading-[.98]"
            style={{ fontSize: "clamp(28px,4vw,48px)" }}
          >
            MY ORDERS
          </h1>
        </div>
        <span className="font-mono text-[11px] md:text-[12px] text-[#6e6455]">
          {orders.length} ORDER{orders.length !== 1 ? "S" : ""}
        </span>
      </div>

      {fetchError ? (
        <div className="text-center py-16">
          <p className="font-mono text-[13px] text-[#e8452c] mb-2">
            Could not load your orders.
          </p>
          <p className="font-mono text-[11px] text-[#6e6455]">{fetchError}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-mono text-[13px] text-[#6e6455] mb-6">
            No orders yet. Start shopping →
          </p>
          <Link
            href="/shop"
            className="inline-block bg-dark text-cream font-bakbak text-[14px] px-6 py-3 rounded-sm hover:bg-[#e8452c] transition-colors"
          >
            SHOP THE POSTERS
          </Link>
          <p className="font-mono text-[9.5px] text-[#d9cfb8] mt-8 break-all">
            session: {userId}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {orders.map((order) => {
            const itemsTotal = order.items.reduce((s, i) => s + i.amount, 0);
            const total = itemsTotal + (order.shipping ?? SHIPPING);
            return (
              <div
                key={order.id}
                className="border border-[#d9cfb8] rounded-sm p-4 md:p-5"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                  <span className="font-mono text-[12px] text-[#453d33]">
                    Order #{order.id}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="font-mono text-[10.5px] text-[#6e6455] mb-3">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="flex flex-col gap-1.5 mb-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-[13px] md:text-[14px]"
                    >
                      <span>
                        {item.product.title}{" "}
                        <span className="text-[#6e6455] text-[12px]">
                          · {item.size}
                        </span>
                      </span>
                      <span className="font-mono">{money(item.amount)}</span>
                    </div>
                  ))}
                </div>
                {order.address && (
                  <div className="border-t border-[#d9cfb8] pt-3 mb-3 font-mono text-[11px] text-[#6e6455] leading-relaxed">
                    <div className="font-semibold tracking-[.1em] mb-1">DELIVER TO</div>
                    <div>{order.address.name} · {order.address.phone}</div>
                    <div>{order.address.line1}, {order.address.city} – {order.address.pincode}</div>
                  </div>
                )}
                <div className="border-t border-[#d9cfb8] pt-3 flex justify-between font-mono text-[12.5px]">
                  <span className="text-[#6e6455]">
                    TOTAL (incl. shipping ₹{order.shipping ?? SHIPPING})
                  </span>
                  <span className="font-semibold">{money(total)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
