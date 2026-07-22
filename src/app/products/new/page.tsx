import { prisma } from "@/lib/db";
import { getLang } from "@/lib/getLang";
import ProductForm from "@/components/ProductForm";

export const dynamic = "force-dynamic";

function toInputDate(d: Date | null): string | null {
  return d ? new Date(d).toISOString().slice(0, 10) : null;
}


function invoiceOpts(
  invoices: {
    id: number;
    supplierId: number;
    number: string;
    date: Date;
    totalAmount: number;
    products: { purchasePrice: number }[];
  }[]
) {
  return invoices.map((i) => ({
    id: i.id,
    supplierId: i.supplierId,
    number: i.number,
    dateStr: new Date(i.date).toISOString().slice(0, 10),
    totalAmount: i.totalAmount,
    enteredSum: i.products.reduce((s, p) => s + p.purchasePrice, 0),
  }));
}

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ copy?: string; invoice?: string }>;
}) {
  const lang = await getLang();
  const { copy, invoice } = await searchParams;
  const copyId = copy ? parseInt(copy, 10) : NaN;
  const invoiceId = invoice ? parseInt(invoice, 10) : NaN;

  const [categories, suppliers, invoices, copySrc] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.invoice.findMany({
      include: { products: { select: { purchasePrice: true } } },
      orderBy: { date: "desc" },
    }),
    isNaN(copyId)
      ? Promise.resolve(null)
      : prisma.product.findUnique({ where: { id: copyId } }),
  ]);

  return (
    <ProductForm
      lang={lang}
      categories={categories}
      suppliers={suppliers}
      invoices={invoiceOpts(invoices)}
      initialInvoiceId={isNaN(invoiceId) ? null : invoiceId}
      copyFrom={
        copySrc
          ? {
              id: copySrc.id,
              name: copySrc.name,
              variant: null, // the new version gets its own variant
              barcode: null, // …and its own barcode
              categoryId: copySrc.categoryId,
              supplierId: copySrc.supplierId,
              invoiceId: copySrc.invoiceId,
              purchaseDate: toInputDate(copySrc.purchaseDate) ?? "",
              packs: copySrc.packs,
              unitsPerPack: copySrc.unitsPerPack,
              purchasePrice: copySrc.purchasePrice,
              marginPercent: copySrc.marginPercent,
              expirationDate: null,
              note: copySrc.note,
              lowStockThreshold: copySrc.lowStockThreshold,
              invoiceImageUrl: null,
            }
          : undefined
      }
    />
  );
}
