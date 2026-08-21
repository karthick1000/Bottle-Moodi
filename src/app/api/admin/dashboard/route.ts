import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUserId, jsonOk, jsonErr } from "@/lib/apiHelpers";

const DAYS_30 = 30;
const DAYS_7 = 7;

function subtractDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function GET(req: NextRequest) {
  try {
    await getAdminUserId(req);

    const since30 = subtractDays(DAYS_30);
    const since7 = subtractDays(DAYS_7);

    // Fetch orders in last 30 days with items
    const recentOrders = await prisma.order.findMany({
      where: { createdAt: { gte: since30 } },
      select: {
        id: true,
        createdAt: true,
        status: true,
        items: { select: { amount: true, productId: true } },
      },
    });

    // Revenue and orders 30d
    const orders30d = recentOrders.length;
    const revenue30d = recentOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.amount, 0),
      0
    );
    const avgOrder = orders30d > 0 ? Math.round(revenue30d / orders30d) : 0;

    // Total units sold (all time)
    const unitsSoldResult = await prisma.orderItem.findMany({ select: { id: true } });
    const unitsSold = unitsSoldResult.length;

    // Revenue chart: daily buckets for last 30 days
    const revMap: Record<string, number> = {};
    for (let i = DAYS_30 - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      revMap[toDateStr(d)] = 0;
    }
    for (const order of recentOrders) {
      const key = toDateStr(new Date(order.createdAt));
      if (key in revMap) {
        revMap[key] += order.items.reduce((s, i) => s + i.amount, 0);
      }
    }
    const revenueChart = Object.entries(revMap).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    // Weekly bars: units sold per weekday in last 7 days
    const last7Orders = recentOrders.filter(
      (o) => new Date(o.createdAt) >= since7
    );
    const weekdayMap: Record<string, number> = {
      Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0,
    };
    for (const order of last7Orders) {
      const dayIndex = new Date(order.createdAt).getDay(); // 0=Sun, 1=Mon...
      const dayName = DAY_NAMES[dayIndex];
      weekdayMap[dayName] = (weekdayMap[dayName] ?? 0) + order.items.length;
    }
    const weeklyBars = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
      (day) => ({ day, units: weekdayMap[day] ?? 0 })
    );

    // Top 5 products by orderItem count
    const itemCounts = await prisma.orderItem.groupBy({
      by: ["productId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });
    const productIds = itemCounts.map((r) => r.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true },
    });
    const productMap = Object.fromEntries(products.map((p) => [p.id, p.title]));
    const topPrints = itemCounts.map((r) => ({
      title: productMap[r.productId] ?? `Product #${r.productId}`,
      units: r._count.id,
    }));

    // Status pie
    const statusGroups = await prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    });
    const STATUS_COLORS: Record<string, string> = {
      PENDING: "#e8452c",
      PAID: "#a8781a",
      SHIPPED: "#1a5fa8",
      CANCELLED: "#6d28d9",
    };
    const statusPie = statusGroups.map((g) => ({
      name: g.status,
      value: g._count.id,
      color: STATUS_COLORS[g.status] ?? "#87998d",
    }));

    return jsonOk({
      revenue30d,
      orders30d,
      unitsSold,
      avgOrder,
      revenueChart,
      weeklyBars,
      topPrints,
      statusPie,
    });
  } catch (res) {
    if (res instanceof Response) return res;
    return jsonErr("Failed to fetch dashboard data", 500);
  }
}
