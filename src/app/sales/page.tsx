import Link from "next/link";
import { PixelIcon } from "@/components/PixelIcon";
import { prisma } from "@/lib/db";
import { money, formatDate } from "@/lib/calc";
import { deleteSale } from "@/app/actions";
import { PageHeader, EmptyState } from "@/components/ui";
import { getLang } from "@/lib/getLang";
import { t } from "@/lib/i18n";
import DeleteForm from "@/components/DeleteForm";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const lang = await getLang();
  const sales = await prisma.sale.findMany({
    include: { product: true },
    orderBy: { saleDate: "desc" },
    take: 200,
  });

  const totalRevenue = sales.reduce((s, x) => s + x.total, 0);

  return (
    <div>
      <PageHeader
        title={t(lang, "sales.title")}
        subtitle={`${sales.length} ${t(lang, "sales.recorded")} · ${money(
          totalRevenue
        )} ${t(lang, "sales.revenueLast")}`}
        action={
          <div className="flex flex-wrap gap-2">
            {sales.length > 0 && (
              <a href="/api/export/xlsx" className="btn btn-ghost">
                <PixelIcon name="disk" /> Excel
              </a>
            )}
            <Link href="/sales/new" className="btn btn-primary">
              {t(lang, "sales.new")}
            </Link>
          </div>
        }
      />

      {sales.length === 0 ? (
        <EmptyState
          title={t(lang, "sales.noneTitle")}
          hint={t(lang, "sales.noneHint")}
          href="/sales/new"
          cta={t(lang, "ana.recordSale")}
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">{t(lang, "sales.date")}</th>
                <th className="px-4 py-3">{t(lang, "table.product")}</th>
                <th className="px-4 py-3 text-right">{t(lang, "sales.qty")}</th>
                <th className="px-4 py-3 text-right">{t(lang, "sales.unitPrice")}</th>
                <th className="px-4 py-3 text-right">{t(lang, "sales.total")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(s.saleDate)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {s.product.name}
                  </td>
                  <td className="px-4 py-3 text-right">{s.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {money(s.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                    {money(s.total)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteForm
                      action={deleteSale}
                      id={s.id}
                      message={`${t(lang, "common.delete")} ${s.quantity} × ${s.product.name}? ${t(lang, "sales.deleteMsg")}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
