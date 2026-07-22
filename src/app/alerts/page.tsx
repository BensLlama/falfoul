import Link from "next/link";
import { PixelIcon } from "@/components/PixelIcon";
import { getExpiryAlerts, getLowStockProducts } from "@/lib/queries";
import { formatDate } from "@/lib/calc";
import { PageHeader, Badge } from "@/components/ui";
import { getLang } from "@/lib/getLang";
import { t, type Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const lang = await getLang();
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
        title={t(lang, "alerts.title")}
        subtitle={t(lang, "alerts.subtitle")}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <ExpiryGroup lang={lang} title={t(lang, "alerts.expired")} tone="red" items={expired} />
          <ExpiryGroup
            lang={lang} title={t(lang, "alerts.in3")}
            tone="red"
            items={in3}
          />
          <ExpiryGroup lang={lang} title={t(lang, "alerts.inWeek")} tone="amber" items={inWeek} />
          <ExpiryGroup lang={lang} title={t(lang, "alerts.inMonth")} tone="blue" items={inMonth} />
          {expiry.length === 0 && (
            <div className="card text-sm text-gray-500">
              {t(lang, "alerts.nothing60")} <PixelIcon name="smile" size={14} className="inline align-[-2px]" />
            </div>
          )}
        </div>

        <div>
          <section className="card">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <PixelIcon name="trend" /> {t(lang, "alerts.lowOut")}
            </h2>
            {lowStock.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t(lang, "alerts.allStocked")} <PixelIcon name="smile" size={14} className="inline align-[-2px]" />
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
                        {p.category} · {t(lang, "alerts.alertAt")} {p.lowStockThreshold} pcs
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
                        {t(lang, "alerts.restock")}
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
  lang,
  title,
  tone,
  items,
}: {
  lang: Lang;
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
                ? `${-e.days}${t(lang, "alerts.agoSuffix")}`
                : e.days === 0
                ? t(lang, "alerts.today")
                : `${t(lang, "alerts.inPrefix")}${e.days}j`}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
