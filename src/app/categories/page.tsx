import { prisma } from "@/lib/db";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/actions";
import { PageHeader } from "@/components/ui";
import CategoryManager from "@/components/CategoryManager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Each card is a main category. Open a group to see what's inside — add, rename or delete anywhere."
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
