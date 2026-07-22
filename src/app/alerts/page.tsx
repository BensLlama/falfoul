import Link from "next/link";
import { PixelIcon } from "@/components/PixelIcon";
import { getExpiryAlerts, getLowStockProducts } from "@/lib/queries";
import { formatDate } from "@/lib/calc";
import { PageHeader, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const [expiry, lowStock] = await Promise.all([
    getExpiryAlerts(60),
    getLowStockProducts(),
  ]);

  const expired = expiry.filter((e) => (e.days ?? 0) < 0);
  const in3 = expiry.filter((e) => (e.days ?? 99) >= 0 && (e.days ?? 99) <= 3);
  const inWeek = expiry.filter(
    (e) => (e.days ?? 99) > 3 && (e.days ?? 99) <= 7
  );
  const inMonth = expiry.filter(
    (e) => (e.days ?? 99) > 7 && (e.days ?? 99) <= 30
  );

  return (
    <div>
      <PageHeader
        title="Alerts"
        subtitle="Expiry reminders (1 month · 1 week · 3 days) and low-stock warnings."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <ExpiryGroup title="🔴 Already expired" tone="red" items={expired} />
          <ExpiryGroup
            title="🟠 Within 3 days"
            tone="red"
            items={in3}
          />
          <ExpiryGroup title="🟡 Within 1 week" tone="amber" items={inWeek} />
          <ExpiryGroup title="🔵 Within 1 month" tone="blue" items={inMonth} />
          {expiry.length === 0 && (
            <div className="card text-sm text-gray-500">
              Nothing expiring in the next 60 days. <PixelIcon name="smile" size={14} className="inline align-[-2px]" />
            </div>
          )}
        </div>

        <div>
          <section className="card">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <PixelIcon name="trend" /> Low / out of stock
            </h2>
            {lowStock.length === 0 ? (
              <p className="text-sm text-gray-500">
                Everything is well stocked. <PixelIcon name="smile" size={14} className="inline align-[-2px]" />
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {lowStock.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <div className="font-medium text-gray-800">{p.name}</div>
                      <div className="text-xs text-gray-500">
                        {p.category} · alert at {p.lowStockThreshold} pcs
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={p.isOut ? "red" : "amber"}>
                        {p.stock} pcs
                      </Badge>
                      <Link
                        href="/products/new"
                        className="text-xs font-medium text-emerald-600 hover:underline"
                      >
                        Restock
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function ExpiryGroup({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "red" | "amber" | "blue";
  items: {
    id: number;
    productName: string;
    totalUnits: number;
    expirationDate: Date | null;
    days: number | null;
  }[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="card">
      <h2 className="mb-3 font-semibold text-gray-900">
        {title}{" "}
        <span className="text-sm font-normal text-gray-400">
          ({items.length})
        </span>
      </h2>
      <ul className="divide-y divide-gray-100">
        {items.map((e) => (
          <li key={e.id} className="flex items-center justify-between py-2.5">
            <div>
              <div className="font-medium text-gray-800">{e.productName}</div>
              <div className="text-xs text-gray-500">
                {e.totalUnits} pcs · {formatDate(e.expirationDate)}
              </div>
            </div>
            <Badge tone={tone}>
              {e.days === null
                ? "—"
                : e.days < 0
                ? `${-e.days}d ago`
                : e.days === 0
                ? "today"
                : `in ${e.days}d`}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
