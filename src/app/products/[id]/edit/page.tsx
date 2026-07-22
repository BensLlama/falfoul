import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/getLang";
import ProductForm from "@/components/ProductForm";

export const dynamic = "force-dynamic";

function toInputDate(d: Date | null): string | null {
  return d ? new Date(d).toISOString().slice(0, 10) : null;
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const lang = await getLang();
  const { id } = await params;
  const productId = parseInt(id, 10);
  const [product, categories, suppliers, invoices] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.invoice.findMany({
      include: { products: { select: { purchasePrice: true } } },
      orderBy: { date: "desc" },
    }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <ProductForm
        lang={lang}
        categories={categories}
        suppliers={suppliers}
        invoices={invoices.map((i) => ({
          id: i.id,
          supplierId: i.supplierId,
          number: i.number,
          dateStr: new Date(i.date).toISOString().slice(0, 10),
          totalAmount: i.totalAmount,
          enteredSum: i.products.reduce((s, p) => s + p.purchasePrice, 0),
        }))}
        product={{
          id: product.id,
          name: product.name,
          variant: product.variant,
          barcode: product.barcode,
          categoryId: product.categoryId,
          supplierId: product.supplierId,
          invoiceId: product.invoiceId,
          purchaseDate: toInputDate(product.purchaseDate) ?? "",
          packs: product.packs,
          unitsPerPack: product.unitsPerPack,
          purchasePrice: product.purchasePrice,
          marginPercent: product.marginPercent,
          expirationDate: toInputDate(product.expirationDate),
          note: product.note,
          lowStockThreshold: product.lowStockThreshold,
          invoiceImageUrl: product.invoiceImageUrl,
        }}
      />
    </div>
  );
}
