import { prisma } from "./db";
import { daysUntil } from "./calc";

/**
 * Current stock (in pieces) for every product:
 *   stock = pieces bought (totalUnits) - pieces sold
 */
export async function getProductsWithStock() {
  const products = await prisma.product.findMany({
    include: { category: true, supplier: true, sales: true },
    orderBy: { createdAt: "desc" },
  });

  return products.map((p) => {
    const bought = p.totalUnits;
    const sold = p.sales.reduce((s, x) => s + x.quantity, 0);
    const stock = bought - sold;

    return {
      id: p.id,
      name: p.name,
      variant: p.variant,
      barcode: p.barcode,
      category: p.category?.name ?? "Uncategorized",
      categoryId: p.categoryId,
      supplier: p.supplier?.name ?? null,
      supplierId: p.supplierId,
      purchaseDate: p.purchaseDate,
      packs: p.packs,
      unitsPerPack: p.unitsPerPack,
      purchasePrice: p.purchasePrice,
      marginPercent: p.marginPercent,
      costPerUnit: p.costPerUnit,
      expirationDate: p.expirationDate,
      invoiceImageUrl: p.invoiceImageUrl,
      note: p.note,
      lowStockThreshold: p.lowStockThreshold,
      stock,
      bought,
      sold,
      isLow: stock <= p.lowStockThreshold,
      isOut: stock <= 0,
      sellPricePerUnit: p.sellPricePerUnit,
      avgCostPerUnit: p.costPerUnit,
      stockValue: p.costPerUnit * Math.max(0, stock),
    };
  });
}

/** Products with an expiration date, sorted by how soon they expire. */
export async function getExpiryAlerts(withinDays = 30) {
  const products = await prisma.product.findMany({
    where: { expirationDate: { not: null } },
    include: { category: true, supplier: true },
    orderBy: { expirationDate: "asc" },
  });

  return products
    .map((p) => ({
      id: p.id,
      productName: p.name,
      category: p.category?.name ?? "Uncategorized",
      supplier: p.supplier?.name ?? null,
      totalUnits: p.totalUnits,
      expirationDate: p.expirationDate,
      days: daysUntil(p.expirationDate),
    }))
    .filter((p) => p.days !== null && p.days <= withinDays)
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
}

export async function getLowStockProducts() {
  const products = await getProductsWithStock();
  return products.filter((p) => p.isLow);
}

/** Best / worst sellers by revenue, profit, and quantity. */
export async function getAnalytics() {
  const products = await prisma.product.findMany({
    include: { sales: true, category: true },
  });

  const rows = products
    .map((p) => {
      const qty = p.sales.reduce((s, x) => s + x.quantity, 0);
      const revenue = p.sales.reduce((s, x) => s + x.total, 0);
      const cogs = p.costPerUnit * qty; // cost of goods sold
      const profit = revenue - cogs;
      return {
        id: p.id,
        name: p.name,
        category: p.category?.name ?? "Uncategorized",
        qty,
        revenue,
        profit,
        margin: revenue > 0 ? (profit / revenue) * 100 : 0,
      };
    })
    .filter((r) => r.qty > 0);

  const byRevenue = [...rows].sort((a, b) => b.revenue - a.revenue);
  const byProfit = [...rows].sort((a, b) => b.profit - a.profit);
  const byQty = [...rows].sort((a, b) => b.qty - a.qty);

  const totals = rows.reduce(
    (acc, r) => {
      acc.revenue += r.revenue;
      acc.profit += r.profit;
      acc.qty += r.qty;
      return acc;
    },
    { revenue: 0, profit: 0, qty: 0 }
  );

  return { rows, byRevenue, byProfit, byQty, totals };
}

export async function getDashboardStats() {
  const [products, expiry, analytics] = await Promise.all([
    getProductsWithStock(),
    getExpiryAlerts(30),
    getAnalytics(),
  ]);

  const totalStockValue = products.reduce((s, p) => s + p.stockValue, 0);
  const lowStock = products.filter((p) => p.isLow);
  const outOfStock = products.filter((p) => p.isOut);

  return {
    productCount: products.length,
    totalStockValue,
    lowStock,
    outOfStock,
    expiry,
    expiringSoon: expiry.filter((e) => (e.days ?? 99) <= 7),
    analytics,
    products,
  };
}
