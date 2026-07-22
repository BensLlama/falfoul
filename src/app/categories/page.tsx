import { prisma } from "@/lib/db";
import { getLang } from "@/lib/getLang";
import { t } from "@/lib/i18n";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/actions";
import { PageHeader } from "@/components/ui";
import { PixelIcon } from "@/components/PixelIcon";
import CategoryManager from "@/components/CategoryManager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const lang = await getLang();
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title={t(lang, "categories.title")}
        subtitle={t(lang, "categories.subtitle")}
        action={
          <a href="/api/export/xlsx" className="btn btn-ghost">
            <PixelIcon name="disk" /> Excel
          </a>
        }
      />
      <CategoryManager
        cats={categories.map((c) => ({
          id: c.id,
          name: c.name,
          parentId: c.parentId,
          productCount: c._count.products,
        }))}
        create={createCategory}
        update={updateCategory}
        remove={deleteCategory}
      />
    </div>
  );
}
