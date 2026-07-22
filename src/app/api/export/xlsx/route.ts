import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { getProductsWithStock } from "@/lib/queries";
import { formatDate } from "@/lib/calc";

export const dynamic = "force-dynamic";

export async function GET() {
  const [products, sales, categories, suppliers, invoices] = await Promise.all([
    getProductsWithStock(),
    prisma.sale.findMany({
      include: { product: true },
      orderBy: { saleDate: "desc" },
    }),
    prisma.category.findMany({
      include: { parent: true, _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.supplier.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.invoice.findMany({
      include: {
        supplier: true,
        products: { select: { purchasePrice: true } },
      },
      orderBy: { date: "desc" },
    }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Falfoul";
  wb.created = new Date();
  const ws = wb.addWorksheet("Products");

  ws.columns = [
    { header: "Product", key: "name", width: 28 },
    { header: "Variant", key: "variant", width: 14 },
    { header: "Barcode", key: "barcode", width: 16 },
    { header: "Category", key: "category", width: 16 },
    { header: "Supplier", key: "supplier", width: 18 },
    { header: "Purchase date", key: "purchaseDate", width: 14 },
    { header: "Packs", key: "packs", width: 8 },
    { header: "Pieces/pack", key: "unitsPerPack", width: 12 },
    { header: "Total pieces", key: "bought", width: 12 },
    { header: "Price paid", key: "purchasePrice", width: 12 },
    { header: "Cost/piece", key: "costPerUnit", width: 12 },
    { header: "Margin %", key: "marginPercent", width: 10 },
    { header: "Sell/piece", key: "sellPricePerUnit", width: 12 },
    { header: "Stock", key: "stock", width: 8 },
    { header: "Stock value", key: "stockValue", width: 12 },
    { header: "Expiration", key: "expiration", width: 14 },
    { header: "Note", key: "note", width: 24 },
  ];

  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD1FAE5" },
  };

  for (const p of products) {
    ws.addRow({
      name: p.name,
      variant: p.variant ?? "",
      barcode: p.barcode ?? "",
      category: p.category,
      supplier: p.supplier ?? "",
      purchaseDate: formatDate(p.purchaseDate),
      packs: p.packs,
      unitsPerPack: p.unitsPerPack,
      bought: p.bought,
      purchasePrice: Number(p.purchasePrice.toFixed(2)),
      costPerUnit: Number(p.costPerUnit.toFixed(2)),
      marginPercent: p.marginPercent,
      sellPricePerUnit: Number(p.sellPricePerUnit.toFixed(2)),
      stock: p.stock,
      stockValue: Number(p.stockValue.toFixed(2)),
      expiration: p.expirationDate ? formatDate(p.expirationDate) : "",
      note: p.note ?? "",
    });
  }

  const wsSales = wb.addWorksheet("Sales");
  wsSales.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Product", key: "product", width: 28 },
    { header: "Quantity", key: "quantity", width: 10 },
    { header: "Unit price", key: "unitPrice", width: 12 },
    { header: "Total", key: "total", width: 12 },
  ];
  wsSales.getRow(1).font = { bold: true };
  wsSales.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD1FAE5" },
  };

  for (const s of sales) {
    wsSales.addRow({
      date: formatDate(s.saleDate),
      product: s.product.name,
      quantity: s.quantity,
      unitPrice: Number(s.unitPrice.toFixed(2)),
      total: Number(s.total.toFixed(2)),
    });
  }

  const header = (w: import("exceljs").Worksheet) => {
    w.getRow(1).font = { bold: true };
    w.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD1FAE5" },
    };
  };

  const wsCat = wb.addWorksheet("Categories");
  wsCat.columns = [
    { header: "Category", key: "name", width: 28 },
    { header: "Parent", key: "parent", width: 28 },
    { header: "Products", key: "products", width: 10 },
  ];
  header(wsCat);
  for (const c of categories) {
    wsCat.addRow({
      name: c.name,
      parent: c.parent?.name ?? "",
      products: c._count.products,
    });
  }

  const wsSup = wb.addWorksheet("Suppliers");
  wsSup.columns = [
    { header: "Supplier", key: "name", width: 28 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Note", key: "note", width: 30 },
    { header: "Products", key: "products", width: 10 },
  ];
  header(wsSup);
  for (const s of suppliers) {
    wsSup.addRow({
      name: s.name,
      phone: s.phone ?? "",
      note: s.note ?? "",
      products: s._count.products,
    });
  }

  const wsInv = wb.addWorksheet("Invoices");
  wsInv.columns = [
    { header: "Facture", key: "number", width: 20 },
    { header: "Supplier", key: "supplier", width: 24 },
    { header: "Date", key: "date", width: 14 },
    { header: "Place", key: "place", width: 18 },
    { header: "Total", key: "total", width: 12 },
    { header: "Entered", key: "entered", width: 12 },
    { header: "Remaining", key: "remaining", width: 12 },
    { header: "Items", key: "items", width: 8 },
  ];
  header(wsInv);
  for (const inv of invoices) {
    const entered = inv.products.reduce((s, p) => s + p.purchasePrice, 0);
    wsInv.addRow({
      number: inv.number,
      supplier: inv.supplier.name,
      date: formatDate(inv.date),
      place: inv.place ?? "",
      total: Number(inv.totalAmount.toFixed(2)),
      entered: Number(entered.toFixed(2)),
      remaining: Number((inv.totalAmount - entered).toFixed(2)),
      items: inv.products.length,
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="falfoul-products-${stamp}.xlsx"`,
    },
  });
}
