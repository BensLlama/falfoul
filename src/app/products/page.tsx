import Link from "next/link";
import { getProductsWithStock } from "@/lib/queries";
import { getLang } from "@/lib/getLang";
import { t } from "@/lib/i18n";
import { money, formatDate, daysUntil } from "@/lib/calc";
import { deleteProduct } from "@/app/actions";
import { PageHeader, EmptyState } from "@/components/ui";
import { PixelIcon } from "@/components/PixelIcon";
import ProductTable, { ProductRow } from "@/components/ProductTable";

export const dynamic = "force-dynamic";

function expiryTone(days: number | null): ProductRow["expiryTone"] {
  if (days === null) return "gray";
  if (days < 0) return "red";
  if (days <= 7) return "amber";
  return "blue";
}

export default async function ProductsPage() {
  const lang = await getLang();
  const products = await getProductsWithStock();

  const rows: ProductRow[] = products.map((p) => {
    const d = daysUntil(p.expirationDate);
    return {
      id: p.id,
      name: p.name,
      variant: p.variant,
      barcode: p.barcode,
      category: p.category,
      supplier: p.supplier,
      purchaseDateStr: formatDate(p.purchaseDate),
      packs: p.packs,
      unitsPerPack: p.unitsPerPack,
      bought: p.bought,
      paidStr: money(p.purchasePrice),
      costStr: money(p.costPerUnit),
      sellStr: money(p.sellPricePerUnit),
      marginPercent: p.marginPercent,
      stock: p.stock,
      isOut: p.isOut,
      isLow: p.isLow,
      expiryStr: p.expirationDate ? formatDate(p.expirationDate) : null,
      expiryTone: expiryTone(d),
      invoiceImageUrl: p.invoiceImageUrl,
    };
  });

  return (
    <div>
      <PageHeader
        title={t(lang, "products.title")}
        subtitle={t(lang, "products.subtitle")}
        action={
          <div className="flex flex-wrap gap-2">
            {products.length > 0 && (
              <>
                <a href="/api/export/xlsx" className="btn btn-ghost">
                  <PixelIcon name="disk" /> Excel
                </a>
                <a
                  href="/products/print"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost"
                >
                  <PixelIcon name="printer" /> PDF / Print
                </a>
              </>
            )}
            <Link href="/products/new" className="btn btn-primary">
              {t(lang, "products.new")}
            </Link>
          </div>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          hint="Save your first product with its invoice details. The app computes cost and selling price per piece for you."
          href="/products/new"
          cta="Save product"
        />
      ) : (
        <ProductTable rows={rows} deleteAction={deleteProduct} />
      )}
    </div>
  );
}
