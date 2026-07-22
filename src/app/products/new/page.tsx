import { prisma } from "@/lib/db";
import { getLang } from "@/lib/getLang";
import ProductForm from "@/components/ProductForm";

export const dynamic = "force-dynamic";

function toInputDate(d: Date | null): string | null {
  return d ? new Date(d).toISOString().slice(0, 10) : null;
}

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ copy?: string }>;
}) {
  const lang = await getLang();
  const { copy } = await searchParams;
  const copyId = copy ? parseInt(copy, 10) : NaN;

  const [categories, suppliers, copySrc] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    isNaN(copyId)
      ? Promise.resolve(null)
      : prisma.product.findUnique({ where: { id: copyId } }),
  ]);

  return (
    <ProductForm
      lang={lang}
      categories={categories}
      suppliers={suppliers}
      copyFrom={
        copySrc
          ? {
              id: copySrc.id,
              name: copySrc.name,
              variant: null, // the new version gets its own variant
              barcode: null, // …and its own barcode
              categoryId: copySrc.categoryId,
              supplierId: copySrc.supplierId,
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
