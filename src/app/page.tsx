import Link from "next/link";
import { getDashboardStats } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { money, formatDate } from "@/lib/calc";
import { PageHeader, StatCard, Badge, EmptyState } from "@/components/ui";
import { PixelIcon } from "@/components/PixelIcon";
import { getLang } from "@/lib/getLang";
import { t } from "@/lib/i18n";

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
  const lang = await getLang();
  const stats = await getDashboardStats();
  const invoicesRaw = await prisma.invoice.findMany({
    include: { supplier: true, products: { select: { purchasePrice: true } } },
    orderBy: { date: "desc" },
  });
  const openInvoices = invoicesRaw
    .map((i) => ({
      id: i.id,
      number: i.number,
      supplier: i.supplier.name,
      total: i.totalAmount,
      remaining:
        i.totalAmount - i.products.reduce((s, p) => s + p.purchasePrice, 0),
    }))
    .filter((i) => i.total > 0 && i.remaining > 0.01)
    .slice(0, 5);
  const topProfit = stats.analytics.byProfit.slice(0, 5);
  const maxProfit = topProfit[0]?.profit || 1;

  const hasData =
    stats.productCount > 0 ||
    stats.expiry.length > 0 ||
    stats.analytics.rows.length > 0;

  return (
    <div>
      <PageHeader
        title={t(lang, "dashboard.title")}
        subtitle={t(lang, "dashboard.subtitle")}
        action={
          <Link href="/products/new" className="btn btn-primary">
            {t(lang, "products.new")}
          </Link>
        }
      />

      {!hasData ? (
        <EmptyState
          title={t(lang, "dash.welcome")}
          hint={t(lang, "dash.welcomeHint")}
          href="/products/new"
          cta={t(lang, "dash.firstProduct")}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label={t(lang, "nav.products")}
              value={stats.productCount}
              sub={t(lang, "dash.inCatalog")}
            />
            <StatCard
              label={t(lang, "dash.stockValue")}
              value={money(stats.totalStockValue)}
              sub={t(lang, "dash.stockValueSub")}
              tone="green"
            />
            <StatCard
              label={t(lang, "dash.lowStock")}
              value={stats.lowStock.length}
              sub={`${stats.outOfStock.length} ${t(lang, "dash.outOfStock")}`}
              tone={stats.lowStock.length ? "amber" : "default"}
            />
            <StatCard
              label={t(lang, "dash.expiring7")}
              value={stats.expiringSoon.length}
              sub={`${stats.expiry.length} ${t(lang, "dash.withinMonth")}`}
              tone={stats.expiringSoon.length ? "red" : "default"}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Expiry reminders */}
            <section className="card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                  <PixelIcon name="clock" /> {t(lang, "dash.expiryReminders")}
                </h2>
                <Link
                  href="/alerts"
                  className="text-sm font-medium text-emerald-600 hover:underline"
                >
                  {t(lang, "dash.viewAll")}
                </Link>
              </div>
              {stats.expiry.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {t(lang, "dash.nothing30")} <PixelIcon name="smile" size={14} className="inline align-[-2px]" />
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
                <PixelIcon name="trend" /> {t(lang, "dash.lowStock")}
              </h2>
                <Link
                  href="/products"
                  className="text-sm font-medium text-emerald-600 hover:underline"
                >
                  {t(lang, "dash.manage")}
                </Link>
              </div>
              {stats.lowStock.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {t(lang, "dash.allStocked")} <PixelIcon name="smile" size={14} className="inline align-[-2px]" />
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
                          {t(lang, "dash.threshold")} {p.lowStockThreshold} pcs
                        </div>
                      </div>
                      <Badge tone={p.isOut ? "red" : "amber"}>
                        {p.stock} {t(lang, "dash.pcsLeft")}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Open factures — the intelligent reminder */}
          {openInvoices.length > 0 && (
            <section className="card card-banana mt-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                  <PixelIcon name="doc" /> {t(lang, "dash.openInvoices")}
                </h2>
                <Link
                  href="/invoices"
                  className="text-sm font-medium text-emerald-600 hover:underline"
                >
                  {t(lang, "dash.viewAll")}
                </Link>
              </div>
              <ul className="divide-y divide-amber-200/60">
                {openInvoices.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div>
                      <div className="pixel font-medium text-gray-800">
                        {i.number}
                      </div>
                      <div className="text-xs text-gray-500">{i.supplier}</div>
                    </div>
                    <Badge tone="amber">
                      {money(i.remaining)} · {t(lang, "inv.remaining")}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Best sellers */}
          <section className="card mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                <PixelIcon name="star" /> {t(lang, "dash.topProfit")}
              </h2>
              <Link
                href="/analytics"
                className="text-sm font-medium text-emerald-600 hover:underline"
              >
                {t(lang, "dash.fullAnalytics")}
              </Link>
            </div>
            {topProfit.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t(lang, "dash.noSales")}
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
