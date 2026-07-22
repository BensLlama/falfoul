import { getAnalytics } from "@/lib/queries";
import { PixelIcon } from "@/components/PixelIcon";
import { money } from "@/lib/calc";
import { PageHeader, StatCard, Bar, EmptyState, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const { rows, byRevenue, byProfit, byQty, totals } = await getAnalytics();

  if (rows.length === 0) {
    return (
      <div>
        <PageHeader title="Analytics" />
        <EmptyState
          title="No sales to analyze yet"
          hint="Record some sales and this page will show your best and worst products by revenue, profit and quantity."
          href="/sales/new"
          cta="Record a sale"
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
        title="Analytics"
        subtitle="Which products are doing well — and which aren't."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue" value={money(totals.revenue)} tone="green" />
        <StatCard label="Profit" value={money(totals.profit)} tone="green" />
        <StatCard label="Pieces sold" value={totals.qty} />
        <StatCard
          label="Avg margin"
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
            <span className="inline-flex items-center gap-2"><PixelIcon name="star" /> Best product (by profit)</span>
          </div>
          <div className="mt-1 text-xl font-bold text-gray-900">
            {best.name}
          </div>
          <div className="mt-1 text-sm text-emerald-600">
            {money(best.profit)} profit · {best.qty} sold
          </div>
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-wide text-gray-500">
            🐌 Weakest product (by profit)
          </div>
          <div className="mt-1 text-xl font-bold text-gray-900">
            {worst.name}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            {money(worst.profit)} profit · {worst.qty} sold
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RankSection
          title="By revenue"
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
          title="By quantity sold"
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
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Sold</th>
              <th className="px-4 py-3 text-right">Revenue</th>
              <th className="px-4 py-3 text-right">Profit</th>
              <th className="px-4 py-3 text-right">Margin</th>
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
