"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { computePricing } from "@/lib/calc";
import { saveUpload } from "@/lib/upload";

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}
function num(v: FormDataEntryValue | null): number {
  // Accept both "12.50" and "12,50" (French keyboards).
  const n = parseFloat(str(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}
function int(v: FormDataEntryValue | null): number {
  const n = parseInt(str(v), 10);
  return isNaN(n) ? 0 : n;
}
function dateOrNull(v: FormDataEntryValue | null): Date | null {
  const s = str(v);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/* ----------------------------- Categories ------------------------------ */

async function resolveCategoryId(
  categoryId: string,
  newCategory: string
): Promise<number | null> {
  const name = newCategory.trim();
  if (name) {
    const existing = await prisma.category.findFirst({
      where: { name, parentId: null },
    });
    if (existing) return existing.id;
    const created = await prisma.category.create({ data: { name } });
    return created.id;
  }
  const id = parseInt(categoryId, 10);
  return isNaN(id) ? null : id;
}

export async function createCategory(formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) return;

  const parentIdRaw = int(formData.get("parentId"));
  const parentId = parentIdRaw > 0 ? parentIdRaw : null;

  // Names are unique per parent — ignore duplicates quietly.
  const existing = await prisma.category.findFirst({
    where: { name, parentId },
  });
  if (!existing) {
    await prisma.category.create({ data: { name, parentId } });
  }

  revalidatePath("/categories");
  revalidatePath("/products");
}

export async function updateCategory(formData: FormData) {
  const id = int(formData.get("id"));
  const name = str(formData.get("name"));
  if (!id || !name) return;

  const parentIdRaw = int(formData.get("parentId"));
  const parentId = parentIdRaw > 0 ? parentIdRaw : null;

  // A category cannot be moved inside itself or one of its descendants.
  let cur = parentId;
  while (cur !== null) {
    if (cur === id) return;
    const c = await prisma.category.findUnique({ where: { id: cur } });
    cur = c?.parentId ?? null;
  }

  // Names are unique per parent — ignore a clashing rename quietly.
  const clash = await prisma.category.findFirst({
    where: { name, parentId, NOT: { id } },
  });
  if (!clash) {
    await prisma.category.update({ where: { id }, data: { name, parentId } });
  }

  revalidatePath("/categories");
  revalidatePath("/products");
}

export async function deleteCategory(formData: FormData) {
  const id = int(formData.get("id"));
  if (id) {
    const cat = await prisma.category.findUnique({ where: { id } });
    if (cat) {
      // Move sub-categories up one level (to the deleted category's
      // parent). If that would clash with the unique name-per-parent
      // rule, make them top-level instead (NULLs never clash).
      try {
        await prisma.category.updateMany({
          where: { parentId: id },
          data: { parentId: cat.parentId },
        });
      } catch {
        await prisma.category.updateMany({
          where: { parentId: id },
          data: { parentId: null },
        });
      }
      // Products become uncategorized (ON DELETE SET NULL).
      await prisma.category.delete({ where: { id } });
    }
  }
  revalidatePath("/categories");
  revalidatePath("/products");
}

/* ------------------------------ Suppliers ------------------------------ */

async function resolveSupplierId(
  supplierId: string,
  newSupplier: string
): Promise<number | null> {
  const name = newSupplier.trim();
  if (name) {
    const existing = await prisma.supplier.findUnique({ where: { name } });
    if (existing) return existing.id;
    const created = await prisma.supplier.create({ data: { name } });
    return created.id;
  }
  const id = parseInt(supplierId, 10);
  return isNaN(id) ? null : id;
}

export async function createSupplier(formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) return;
  const existing = await prisma.supplier.findUnique({ where: { name } });
  if (!existing) {
    await prisma.supplier.create({
      data: {
        name,
        phone: str(formData.get("phone")) || null,
        note: str(formData.get("note")) || null,
      },
    });
  }
  revalidatePath("/suppliers");
  revalidatePath("/products");
}

export async function updateSupplier(formData: FormData) {
  const id = int(formData.get("id"));
  const name = str(formData.get("name"));
  if (!id || !name) return;
  const clash = await prisma.supplier.findFirst({
    where: { name, NOT: { id } },
  });
  if (clash) return;
  await prisma.supplier.update({
    where: { id },
    data: {
      name,
      phone: str(formData.get("phone")) || null,
      note: str(formData.get("note")) || null,
    },
  });
  revalidatePath("/suppliers");
  revalidatePath("/products");
}

export async function deleteSupplier(formData: FormData) {
  const id = int(formData.get("id"));
  // Products keep existing but lose the link (ON DELETE SET NULL).
  if (id) await prisma.supplier.delete({ where: { id } });
  revalidatePath("/suppliers");
  revalidatePath("/products");
}

/* ------------------------------ Invoices ------------------------------- */

export async function createInvoice(formData: FormData) {
  const supplierId = int(formData.get("supplierId"));
  const number = str(formData.get("number"));
  if (!supplierId || !number) return;

  // Guard against double-taps: same fournisseur + same number = same
  // facture, never create it twice.
  const existing = await prisma.invoice.findFirst({
    where: { supplierId, number },
  });
  if (existing) return;

  const imageUrl = await saveUpload(formData.get("image") as File | null);

  await prisma.invoice.create({
    data: {
      supplierId,
      number,
      date: dateOrNull(formData.get("date")) ?? new Date(),
      place: str(formData.get("place")) || null,
      totalAmount: num(formData.get("totalAmount")),
      imageUrl,
    },
  });

  revalidatePath("/invoices");
  revalidatePath("/suppliers");
}

export async function updateInvoice(formData: FormData) {
  const id = int(formData.get("id"));
  if (!id) return;
  const newImage = await saveUpload(formData.get("image") as File | null);
  const data = {
    number: str(formData.get("number")),
    date: dateOrNull(formData.get("date")) ?? new Date(),
    place: str(formData.get("place")) || null,
    totalAmount: num(formData.get("totalAmount")),
  };
  await prisma.invoice.update({
    where: { id },
    data: newImage ? { ...data, imageUrl: newImage } : data,
  });
  revalidatePath("/invoices");
}

export async function deleteInvoice(formData: FormData) {
  const id = int(formData.get("id"));
  // Items stay as products — they just lose the facture link.
  if (id) await prisma.invoice.delete({ where: { id } });
  revalidatePath("/invoices");
  revalidatePath("/products");
}

/* -------- Build the shared product+purchase data from a form ----------- */

async function buildProductData(formData: FormData) {
  const packs = Math.max(1, int(formData.get("packs")) || 1);
  const unitsPerPack = Math.max(1, int(formData.get("unitsPerPack")) || 1);
  const purchasePrice = num(formData.get("purchasePrice"));
  const marginPercent = num(formData.get("marginPercent"));

  const pricing = computePricing({
    packs,
    unitsPerPack,
    purchasePrice,
    marginPercent,
  });

  const categoryId = await resolveCategoryId(
    str(formData.get("categoryId")),
    str(formData.get("newCategory"))
  );
  const supplierId = await resolveSupplierId(
    str(formData.get("supplierId")),
    str(formData.get("newSupplier"))
  );

  const invoiceIdRaw = int(formData.get("invoiceId"));

  return {
    name: str(formData.get("name")),
    variant: str(formData.get("variant")) || null,
    barcode: str(formData.get("barcode")) || null,
    categoryId,
    supplierId,
    invoiceId: invoiceIdRaw > 0 ? invoiceIdRaw : null,
    purchaseDate: dateOrNull(formData.get("purchaseDate")) ?? new Date(),
    packs,
    unitsPerPack,
    totalUnits: pricing.totalUnits,
    purchasePrice,
    marginPercent,
    costPerUnit: pricing.costPerUnit,
    sellPricePerUnit: pricing.sellPricePerUnit,
    expirationDate: dateOrNull(formData.get("expirationDate")),
    note: str(formData.get("note")) || null,
    lowStockThreshold: Math.max(0, int(formData.get("lowStockThreshold"))),
  };
}

/* ------------------------------ Products ------------------------------- */

export async function createProduct(formData: FormData) {
  const data = await buildProductData(formData);
  if (!data.name) return;

  const invoiceImageUrl = await saveUpload(
    formData.get("invoice") as File | null
  );

  await prisma.product.create({
    data: { ...data, invoiceImageUrl },
  });

  revalidatePath("/products");
  revalidatePath("/");
  redirect("/products");
}

export async function updateProduct(formData: FormData) {
  const id = int(formData.get("id"));
  if (!id) return;

  const data = await buildProductData(formData);
  if (!data.name) return;

  const newInvoice = await saveUpload(formData.get("invoice") as File | null);

  await prisma.product.update({
    where: { id },
    // Keep the existing invoice image if no new one was uploaded.
    data: newInvoice ? { ...data, invoiceImageUrl: newInvoice } : data,
  });

  revalidatePath("/products");
  revalidatePath("/");
  redirect("/products");
}

export async function deleteProduct(formData: FormData) {
  const id = int(formData.get("id"));
  if (id) await prisma.product.delete({ where: { id } });
  revalidatePath("/products");
  revalidatePath("/");
}

/* -------------------------------- Sales -------------------------------- */

export async function createSale(formData: FormData) {
  const productId = int(formData.get("productId"));
  if (!productId) return;

  const quantity = Math.max(1, int(formData.get("quantity")) || 1);
  const unitPrice = num(formData.get("unitPrice"));

  await prisma.sale.create({
    data: {
      productId,
      quantity,
      unitPrice,
      total: quantity * unitPrice,
      saleDate: dateOrNull(formData.get("saleDate")) ?? new Date(),
    },
  });

  revalidatePath("/sales");
  revalidatePath("/products");
  revalidatePath("/analytics");
  revalidatePath("/");
  redirect("/sales");
}

export async function deleteSale(formData: FormData) {
  const id = int(formData.get("id"));
  if (id) await prisma.sale.delete({ where: { id } });
  revalidatePath("/sales");
  revalidatePath("/analytics");
  revalidatePath("/");
}
