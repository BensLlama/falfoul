import { getAnalytics } from "@/lib/queries";
import { PixelIcon } from "@/components/PixelIcon";
import { money } from "@/lib/calc";
import { getLang } from "@/lib/getLang";
import { t } from "@/lib/i18n";
import { PageHeader, StatCard, Bar, EmptyState, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const lang = await getLang();
  const { rows, byRevenue, byProfit, byQty, totals } = await getAnalytics();

  if (rows.length === 0) {
    return (
      <div>
        <PageHeader title={t(lang, "analytics.title")} />
        <EmptyState
          title={t(lang, "ana.noneTitle")}
          hint={t(lang, "ana.noneHint")}
          href="/sales/new"
          cta={t(lang, "ana.recordSale")}
        />
      </div>
    );
  }

  const best = byProfit[0];
  const worst = byProfit[byProfit.length - 1];
  const maxRevenue = byRevenue[0]?.revenue || 1;
  const maxQty = byQty[0]?.qty || 1;

  return (
    <div>
      <PageHeader
        title={t(lang, "analytics.title")}
        subtitle={t(lang, "ana.subtitle")}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t(lang, "ana.revenue")} value={money(totals.revenue)} tone="green" />
        <StatCard label={t(lang, "ana.profit")} value={money(totals.profit)} tone="green" />
        <StatCard label={t(lang, "ana.piecesSold")} value={totals.qty} />
        <StatCard
          label={t(lang, "ana.avgMargin")}
          value={`${
            totals.revenue > 0
              ? ((totals.profit / totals.revenue) * 100).toFixed(1)
              : 0
          }%`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card">
          <div className="text-xs uppercase tracking-wide text-gray-500">
            <span className="inline-flex items-center gap-2"><PixelIcon name="star" /> {t(lang, "ana.best")}</span>
          </div>
          <div className="mt-1 text-xl font-bold text-gray-900">
            {best.name}
          </div>
          <div className="mt-1 text-sm text-emerald-600">
            {money(best.profit)} {t(lang, "ana.profitWord")} · {best.qty} {t(lang, "ana.soldWord")}
          </div>
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-wide text-gray-500">
            {t(lang, "ana.worst")}
          </div>
          <div className="mt-1 text-xl font-bold text-gray-900">
            {worst.name}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            {money(worst.profit)} {t(lang, "ana.profitWord")} · {worst.qty} {t(lang, "ana.soldWord")}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RankSection
          title={t(lang, "ana.byRevenue")}
          rows={byRevenue.slice(0, 8).map((r) => ({
            id: r.id,
            name: r.name,
            value: r.revenue,
            label: money(r.revenue),
          }))}
          max={maxRevenue}
          tone="blue"
        />
        <RankSection
          title={t(lang, "ana.byQty")}
          rows={byQty.slice(0, 8).map((r) => ({
            id: r.id,
            name: r.name,
            value: r.qty,
            label: `${r.qty} pcs`,
          }))}
          max={maxQty}
          tone="green"
        />
      </div>

      <section className="card mt-6 overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">{t(lang, "ana.product")}</th>
              <th className="px-4 py-3">{t(lang, "ana.category")}</th>
              <th className="px-4 py-3 text-right">{t(lang, "ana.sold")}</th>
              <th className="px-4 py-3 text-right">{t(lang, "ana.revenue")}</th>
              <th className="px-4 py-3 text-right">{t(lang, "ana.profit")}</th>
              <th className="px-4 py-3 text-right">{t(lang, "ana.margin")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {byProfit.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/60">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {r.name}
                </td>
                <td className="px-4 py-3 text-gray-500">{r.category}</td>
                <td className="px-4 py-3 text-right">{r.qty}</td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {money(r.revenue)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                  {money(r.profit)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Badge tone={r.margin >= 15 ? "green" : "amber"}>
                    {r.margin.toFixed(1)}%
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function RankSection({
  title,
  rows,
  max,
  tone,
}: {
  title: string;
  rows: { id: number; name: string; value: number; label: string }[];
  max: number;
  tone: "green" | "blue" | "red";
}) {
  return (
    <section className="card">
      <h2 className="mb-4 font-semibold text-gray-900">{title}</h2>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-3">
            <div className="w-36 shrink-0 truncate text-sm text-gray-700">
              {r.name}
            </div>
            <div className="flex-1">
              <Bar value={r.value} max={max} tone={tone} />
            </div>
            <div className="w-20 shrink-0 text-right text-xs font-medium text-gray-600">
              {r.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
