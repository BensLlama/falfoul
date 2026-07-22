import { getProductsWithStock } from "@/lib/queries";
import SaleForm from "@/components/SaleForm";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewSalePage() {
  const products = (await getProductsWithStock()).map((p) => ({
    id: p.id,
    name: p.name,
    stock: p.stock,
    sellPricePerUnit: p.sellPricePerUnit,
  }));

  return (
    <div>
      <PageHeader
        title="Record a sale"
        subtitle="Recording sales keeps your stock accurate and powers the analytics."
      />
      <SaleForm products={products} />
    </div>
  );
}
