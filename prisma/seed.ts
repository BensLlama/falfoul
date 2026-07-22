import { PrismaClient } from "@prisma/client";
import { computePricing } from "../src/lib/calc";

const prisma = new PrismaClient();

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log("Seeding sample data…");

  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const catNames = ["Drinks", "Snacks", "Dairy", "Cleaning", "Bakery"];
  const cats: Record<string, number> = {};
  for (const name of catNames) {
    const c = await prisma.category.create({ data: { name } });
    cats[name] = c.id;
  }

  const seed = [
    { name: "Sidi Ali water 1.5L", cat: "Drinks", unitsPerPack: 6, threshold: 12, packs: 20, price: 480, margin: 25, expiresInDays: 200, sold: 70 },
    { name: "Coca-Cola 33cl can", cat: "Drinks", unitsPerPack: 24, threshold: 24, packs: 10, price: 720, margin: 30, expiresInDays: 120, sold: 180 },
    { name: "Chips Master 45g", cat: "Snacks", unitsPerPack: 20, threshold: 20, packs: 8, price: 240, margin: 40, expiresInDays: 25, sold: 90 },
    { name: "Milk Jaouda 1L", cat: "Dairy", unitsPerPack: 12, threshold: 15, packs: 6, price: 396, margin: 18, expiresInDays: 6, sold: 60 },
    { name: "Yogurt Danone x4", cat: "Dairy", unitsPerPack: 6, threshold: 10, packs: 5, price: 300, margin: 22, expiresInDays: 2, sold: 22 },
    { name: "Dish soap 750ml", cat: "Cleaning", unitsPerPack: 12, threshold: 8, packs: 3, price: 288, margin: 35, expiresInDays: 400, sold: 10 },
    { name: "Baguette", cat: "Bakery", unitsPerPack: 10, threshold: 20, packs: 10, price: 100, margin: 50, expiresInDays: 1, sold: 88 },
  ];

  for (const s of seed) {
    const pricing = computePricing({
      packs: s.packs,
      unitsPerPack: s.unitsPerPack,
      purchasePrice: s.price,
      marginPercent: s.margin,
    });

    const product = await prisma.product.create({
      data: {
        name: s.name,
        categoryId: cats[s.cat],
        supplier: "Metro Wholesale",
        purchaseDate: daysFromNow(-20),
        packs: s.packs,
        unitsPerPack: s.unitsPerPack,
        totalUnits: pricing.totalUnits,
        purchasePrice: s.price,
        marginPercent: s.margin,
        costPerUnit: pricing.costPerUnit,
        sellPricePerUnit: pricing.sellPricePerUnit,
        expirationDate: daysFromNow(s.expiresInDays),
        lowStockThreshold: s.threshold,
      },
    });

    if (s.sold > 0) {
      await prisma.sale.create({
        data: {
          productId: product.id,
          quantity: s.sold,
          unitPrice: pricing.sellPricePerUnit,
          total: pricing.sellPricePerUnit * s.sold,
          saleDate: daysFromNow(-5),
        },
      });
    }
  }

  console.log("Done. Seeded", seed.length, "products.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
