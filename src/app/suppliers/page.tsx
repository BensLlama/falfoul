import { prisma } from "@/lib/db";
import { getLang } from "@/lib/getLang";
import { t } from "@/lib/i18n";
import {
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "@/app/actions";
import { PageHeader } from "@/components/ui";
import { PixelIcon } from "@/components/PixelIcon";
import SupplierManager from "@/components/SupplierManager";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const lang = await getLang();
  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title={t(lang, "suppliers.title")}
        subtitle={t(lang, "suppliers.subtitle")}
        action={
          suppliers.length > 0 ? (
            <a href="/api/export/xlsx" className="btn btn-ghost">
              <PixelIcon name="disk" /> Excel
            </a>
          ) : undefined
        }
      />
      <SupplierManager
        suppliers={suppliers.map((s) => ({
          id: s.id,
          name: s.name,
          phone: s.phone,
          note: s.note,
          productCount: s._count.products,
        }))}
        create={createSupplier}
        update={updateSupplier}
        remove={deleteSupplier}
      />
    </div>
  );
}
