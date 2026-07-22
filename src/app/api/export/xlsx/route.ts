import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { getProductsWithStock } from "@/lib/queries";
import { formatDate } from "@/lib/calc";

export const dynamic = "force-dynamic";

export async function GET() {
  const [products, sales] = await Promise.all([
    getProductsWithStock(),
    prisma.sale.findMany({
      include: { product: true },
      orderBy: { saleDate: "desc" },
    }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Falfoul";
  wb.created = new Date();
  const ws = wb.addWorksheet("Products");

  ws.columns = [
    { header: "Product", key: "name", width: 28 },
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
