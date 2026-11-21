import Link from "next/link";
import { getOrders } from "@/actions/orders/orders"; 
import type { OrderRow } from "@/lib/type";

// Always read fresh data instead of prerendering at build time
export const dynamic = "force-dynamic";

const DAYS = 14;
const money = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR", // change if you bill in another currency
  maximumFractionDigits: 0,
});

// Orders that no longer count toward revenue
const NOT_COUNTED = ["CANCELLED", "REFUNDED"];

const STATUS: Record<string, { label: string; badge: string; bar: string }> = {
  PENDING: {
    label: "Pending",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    bar: "bg-amber-400",
  },
  PROCESSING: {
    label: "Processing",
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    bar: "bg-blue-500",
  },
  SHIPPED: {
    label: "Shipped",
    badge: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
    bar: "bg-violet-500",
  },
  DELIVERED: {
    label: "Delivered",
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  CANCELLED: {
    label: "Cancelled",
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400",
    bar: "bg-gray-400",
  },
  REFUNDED: {
    label: "Refunded",
    badge: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
    bar: "bg-rose-400",
  },
};

const fallbackStyle = STATUS.CANCELLED;

const dayKey = (d: Date) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD in server time

function buildDashboard(orders: OrderRow[]) {
  const counted = orders.filter((o) => !NOT_COUNTED.includes(o.status));
  const revenue = counted.reduce((sum, o) => sum + o.totalAmount, 0);

  // Revenue per day for the last DAYS days
  const series = Array.from({ length: DAYS }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (DAYS - 1 - i));
    return { key: dayKey(date), date, revenue: 0, orders: 0 };
  });
  const byKey = new Map(series.map((s) => [s.key, s]));
  for (const o of counted) {
    const slot = byKey.get(dayKey(new Date(o.createdAt)));
    if (slot) {
      slot.revenue += o.totalAmount;
      slot.orders += 1;
    }
  }
  const periodRevenue = series.reduce((s, d) => s + d.revenue, 0);
  const maxDay = Math.max(...series.map((d) => d.revenue), 1);

  // Orders per status
  const statusCounts = Object.keys(STATUS).map((key) => ({
    key,
    count: orders.filter((o) => o.status === key).length,
  }));

  // Top products by units sold
  const productQty = new Map<string, number>();
  for (const o of counted) {
    for (const item of o.orderItems) {
      const name = item.productVariant?.name ?? "Unknown product";
      productQty.set(name, (productQty.get(name) ?? 0) + item.quantity);
    }
  }
  const topProducts = [...productQty.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    revenue,
    avgOrder: counted.length ? revenue / counted.length : 0,
    pending: orders.filter((o) => o.status === "PENDING").length,
    unpaid: counted.filter((o) => o.paymentStatus !== "PAID").length,
    series,
    periodRevenue,
    maxDay,
    statusCounts,
    topProducts,
    recent: orders.slice(0, 8), // getOrders is already newest first
  };
}

const panel =
  "rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]";

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? fallbackStyle;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.badge}`}>
      {s.label}
    </span>
  );
}

export default async function Dashboard() {
  const orders = await getOrders();
  const d = buildDashboard(orders);
  const totalOrders = orders.length;

  const stats = [
    { label: "Revenue", value: money.format(d.revenue), note: "Excludes cancelled and refunded" },
    { label: "Orders", value: totalOrders.toLocaleString(), note: `${d.pending} waiting to be processed` },
    { label: "Average order", value: money.format(d.avgOrder), note: "Across active orders" },
    { label: "Unpaid", value: d.unpaid.toLocaleString(), note: "Active orders not marked paid" },
  ];

  return (
    <main className="space-y-6 text-gray-900 dark:text-white/90">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Link
          href="/orders"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          View all orders
        </Link>
      </header>

      {/* Key numbers in one panel, separated by dividers */}
      <section
        aria-label="Key numbers"
        className={`${panel} grid grid-cols-2 divide-x divide-y divide-gray-200 overflow-hidden dark:divide-gray-800 lg:grid-cols-4 lg:divide-y-0`}
      >
        {stats.map((s) => (
          <div key={s.label} className="p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{s.value}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{s.note}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <section className={`${panel} p-5 lg:col-span-2`}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold">Revenue, last {DAYS} days</h2>
            <p className="text-sm font-medium tabular-nums">{money.format(d.periodRevenue)}</p>
          </div>

          <div
            className="mt-6 flex h-48 items-end gap-1.5 sm:gap-2"
            role="img"
            aria-label={`Daily revenue for the last ${DAYS} days, total ${money.format(d.periodRevenue)}`}
          >
            {d.series.map((day) => {
              const pct = (day.revenue / d.maxDay) * 100;
              return (
                <div
                  key={day.key}
                  className="group flex h-full flex-1 flex-col justify-end"
                  title={`${day.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}: ${money.format(day.revenue)} from ${day.orders} order${day.orders === 1 ? "" : "s"}`}
                >
                  <div
                    className={`w-full rounded-t-md transition-colors ${
                      day.revenue > 0
                        ? "bg-indigo-500 group-hover:bg-indigo-600"
                        : "bg-gray-200 dark:bg-gray-800"
                    }`}
                    style={{ height: day.revenue > 0 ? `${Math.max(pct, 3)}%` : "3px" }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{d.series[0].date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
            <span>Today</span>
          </div>
        </section>

        {/* Status breakdown */}
        <section className={`${panel} p-5`}>
          <h2 className="text-base font-semibold">Orders by status</h2>

          {totalOrders === 0 ? (
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              No orders yet. They will appear here once the first one comes in.
            </p>
          ) : (
            <>
              <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                {d.statusCounts
                  .filter((s) => s.count > 0)
                  .map((s) => (
                    <div
                      key={s.key}
                      className={STATUS[s.key].bar}
                      style={{ width: `${(s.count / totalOrders) * 100}%` }}
                      title={`${STATUS[s.key].label}: ${s.count}`}
                    />
                  ))}
              </div>
              <ul className="mt-5 space-y-3">
                {d.statusCounts.map((s) => (
                  <li key={s.key} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`size-2.5 rounded-full ${STATUS[s.key].bar}`} />
                      {STATUS[s.key].label}
                    </span>
                    <span className="tabular-nums text-gray-500 dark:text-gray-400">{s.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* Recent orders */}
        <section className={`${panel} lg:col-span-2`}>
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-base font-semibold">Recent orders</h2>
            <Link href="/orders" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              See all
            </Link>
          </div>

          {d.recent.length === 0 ? (
            <p className="px-5 pb-6 text-sm text-gray-500 dark:text-gray-400">No orders to show yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-y border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Order</th>
                    <th className="px-5 py-2.5 font-medium">Customer</th>
                    <th className="px-5 py-2.5 font-medium">Date</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                    <th className="px-5 py-2.5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {d.recent.map((o) => (
                    <tr key={o.id}>
                      <td className="px-5 py-3 font-medium">{o.orderNumber}</td>
                      <td className="px-5 py-3">{o.customer?.name ?? "Walk-in"}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                        {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">{money.format(o.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Top products */}
        <section className={`${panel} p-5`}>
          <h2 className="text-base font-semibold">Best sellers</h2>
          {d.topProducts.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              Sales will show up here once orders include products.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {d.topProducts.map(([name, qty]) => (
                <li key={name}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate">{name}</span>
                    <span className="shrink-0 tabular-nums text-gray-500 dark:text-gray-400">{qty} sold</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${(qty / d.topProducts[0][1]) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}