import Link from "next/link";
import { getDashboardStats } from "@/lib/queries";
import { money, formatDate } from "@/lib/calc";
import { PageHeader, StatCard, Badge, EmptyState } from "@/components/ui";
import { PixelIcon } from "@/components/PixelIcon";

export const dynamic = "force-dynamic";

function expiryTone(days: number | null) {
  if (days === null) return "gray" as const;
  if (days < 0) return "red" as const;
  if (days <= 3) return "red" as const;
  if (days <= 7) return "amber" as const;
  return "blue" as const;
}

function expiryLabel(days: number | null) {
  if (days === null) return "—";
  if (days < 0) return `Expired ${-days}d ago`;
  if (days === 0) return "Expires today";
  return `In ${days} day${days === 1 ? "" : "s"}`;
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const topProfit = stats.analytics.byProfit.slice(0, 5);
  const maxProfit = topProfit[0]?.profit || 1;

  const hasData =
    stats.productCount > 0 ||
    stats.expiry.length > 0 ||
    stats.analytics.rows.length > 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="A quick look at your store: stock value, expiring items, low stock and best sellers."
        action={
          <Link href="/products/new" className="btn btn-primary">
            + Save product
          </Link>
        }
      />

      {!hasData ? (
        <EmptyState
          title="Welcome to Falfoul"
          hint="Start by adding a product, then record a purchase from a supplier invoice. The app will compute your cost and selling price per piece automatically."
          href="/products/new"
          cta="Add your first product"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Products"
              value={stats.productCount}
              sub="in your catalog"
            />
            <StatCard
              label="Stock value"
              value={money(stats.totalStockValue)}
              sub="cost of remaining stock"
              tone="green"
            />
            <StatCard
              label="Low stock"
              value={stats.lowStock.length}
              sub={`${stats.outOfStock.length} out of stock`}
              tone={stats.lowStock.length ? "amber" : "default"}
            />
            <StatCard
              label="Expiring ≤ 7 days"
              value={stats.expiringSoon.length}
              sub={`${stats.expiry.length} within a month`}
              tone={stats.expiringSoon.length ? "red" : "default"}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Expiry reminders */}
            <section className="card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                  <PixelIcon name="clock" /> Expiry reminders
                </h2>
                <Link
                  href="/alerts"
                  className="text-sm font-medium text-emerald-600 hover:underline"
                >
                  View all
                </Link>
              </div>
              {stats.expiry.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nothing expiring in the next 30 days. <PixelIcon name="smile" size={14} className="inline align-[-2px]" />
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {stats.expiry.slice(0, 6).map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between py-2.5"
                    >
                      <div>
                        <div className="font-medium text-gray-800">
                          {e.productName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {e.totalUnits} pcs · {formatDate(e.expirationDate)}
                        </div>
                      </div>
                      <Badge tone={expiryTone(e.days)}>
                        {expiryLabel(e.days)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Low stock */}
            <section className="card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                <PixelIcon name="trend" /> Low stock
              </h2>
                <Link
                  href="/products"
                  className="text-sm font-medium text-emerald-600 hover:underline"
                >
                  Manage
                </Link>
              </div>
              {stats.lowStock.length === 0 ? (
                <p className="text-sm text-gray-500">
                  All products are well stocked. <PixelIcon name="smile" size={14} className="inline align-[-2px]" />
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {stats.lowStock.slice(0, 6).map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between py-2.5"
                    >
                      <div>
                        <div className="font-medium text-gray-800">
                          {p.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          threshold {p.lowStockThreshold} pcs
                        </div>
                      </div>
                      <Badge tone={p.isOut ? "red" : "amber"}>
                        {p.stock} pcs left
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Best sellers */}
          <section className="card mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                <PixelIcon name="star" /> Top products by profit
              </h2>
              <Link
                href="/analytics"
                className="text-sm font-medium text-emerald-600 hover:underline"
              >
                Full analytics
              </Link>
            </div>
            {topProfit.length === 0 ? (
              <p className="text-sm text-gray-500">
                No sales recorded yet. Record a sale to see analytics.
              </p>
            ) : (
              <div className="space-y-3">
                {topProfit.map((r) => (
                  <div key={r.id} className="flex items-center gap-4">
                    <div className="w-40 shrink-0 truncate text-sm font-medium text-gray-800">
                      {r.name}
                    </div>
                    <div className="h-3 flex-1 overflow-hidden border-2 border-gray-900 bg-white">
                      <div
                        className="h-full bg-emerald-500"
                        style={{
                          width: `${Math.max(
                            3,
                            Math.round((r.profit / maxProfit) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="w-28 shrink-0 text-right text-sm font-semibold text-emerald-600">
                      {money(r.profit)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
