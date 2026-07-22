import { prisma } from "@/lib/db";
import { getLang } from "@/lib/getLang";
import { t } from "@/lib/i18n";
import { money, formatDate } from "@/lib/calc";
import {
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from "@/app/actions";
import { PageHeader } from "@/components/ui";
import InvoiceManager, { InvoiceRow } from "@/components/InvoiceManager";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const lang = await getLang();
  const [invoices, suppliers] = await Promise.all([
    prisma.invoice.findMany({
      include: {
        supplier: true,
        products: { select: { purchasePrice: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);

  const rows: InvoiceRow[] = invoices.map((inv) => {
    const entered = inv.products.reduce((s, p) => s + p.purchasePrice, 0);
    const remaining = inv.totalAmount - entered;
    return {
      id: inv.id,
      supplierName: inv.supplier.name,
      number: inv.number,
      dateStr: new Date(inv.date).toISOString().slice(0, 10),
      dateLabel: formatDate(inv.date),
      place: inv.place,
      totalAmount: inv.totalAmount,
      enteredSum: entered,
      itemCount: inv.products.length,
      imageUrl: inv.imageUrl,
      totalStr: money(inv.totalAmount),
      enteredStr: money(entered),
      remainingStr: money(Math.abs(remaining)),
    };
  });

  return (
    <div>
      <PageHeader
        title={t(lang, "inv.title")}
        subtitle={t(lang, "inv.subtitle")}
      />
      <InvoiceManager
        invoices={rows}
        suppliers={suppliers}
        create={createInvoice}
        update={updateInvoice}
        remove={deleteInvoice}
      />
    </div>
  );
}
