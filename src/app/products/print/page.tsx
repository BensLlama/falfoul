import Link from "next/link";
import { getProductsWithStock } from "@/lib/queries";
import { money, formatDate } from "@/lib/calc";
import { CURRENCY } from "@/lib/config";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function PrintProductsPage() {
  const products = await getProductsWithStock();
  const totalValue = products.reduce((s, p) => s + p.stockValue, 0);
  const stamp = new Date().toLocaleString();

  return (
    <div className="print-area">
      <div className="mb-6 flex items-center justify-between no-print">
        <Link href="/products" className="text-sm text-emerald-600 hover:underline">
          ← Back to products
        </Link>
        <PrintButton />
      </div>

      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Falfoul — Products</h1>
          <p className="text-sm text-gray-500">Generated {stamp}</p>
        </div>
        <div className="text-right text-sm">
          <div className="text-gray-500">{products.length} products</div>
          <div className="font-semibold">
            Stock value: {money(totalValue)}
          </div>
        </div>
      </div>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b-2 border-gray-800 text-left">
            <th className="py-2 pr-2">Product</th>
            <th className="py-2 pr-2">Category</th>
            <th className="py-2 pr-2">Supplier</th>
            <th className="py-2 pr-2">Date</th>
            <th className="py-2 pr-2 text-right">Pcs</th>
            <th className="py-2 pr-2 text-right">Paid ({CURRENCY})</th>
            <th className="py-2 pr-2 text-right">Cost/pc</th>
            <th className="py-2 pr-2 text-right">Sell/pc</th>
            <th className="py-2 pr-2 text-right">Stock</th>
            <th className="py-2 pr-2">Expiry</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-gray-200">
              <td className="py-1.5 pr-2 font-medium">{p.name}</td>
              <td className="py-1.5 pr-2">{p.category}</td>
              <td className="py-1.5 pr-2">{p.supplier || "—"}</td>
              <td className="py-1.5 pr-2">{formatDate(p.purchaseDate)}</td>
              <td className="py-1.5 pr-2 text-right">{p.bought}</td>
              <td className="py-1.5 pr-2 text-right">
                {p.purchasePrice.toFixed(2)}
              </td>
              <td className="py-1.5 pr-2 text-right">
                {p.costPerUnit.toFixed(2)}
              </td>
              <td className="py-1.5 pr-2 text-right font-semibold">
                {p.sellPricePerUnit.toFixed(2)}
              </td>
              <td className="py-1.5 pr-2 text-right">{p.stock}</td>
              <td className="py-1.5 pr-2">
                {p.expirationDate ? formatDate(p.expirationDate) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-6 text-xs text-gray-400 no-print">
        Tip: in the print dialog, choose “Save as PDF” as the destination to get
        a PDF file.
      </p>
    </div>
  );
}
