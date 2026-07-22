"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createSale } from "@/app/actions";
import { money } from "@/lib/calc";

type Product = {
  id: number;
  name: string;
  stock: number;
  sellPricePerUnit: number;
};

export default function SaleForm({ products }: { products: Product[] }) {
  const [productId, setProductId] = useState<number | "">(
    products[0]?.id ?? ""
  );
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(
    products[0]?.sellPricePerUnit ?? 0
  );

  const selected = products.find((p) => p.id === productId);
  const total = useMemo(() => quantity * unitPrice, [quantity, unitPrice]);
  const today = new Date().toISOString().slice(0, 10);

  function onProductChange(id: number) {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p) setUnitPrice(p.sellPricePerUnit);
  }

  if (products.length === 0) {
    return (
      <div className="card">
        <p className="text-sm text-gray-600">
          Add a product and record a purchase first, then you can sell it.
        </p>
      </div>
    );
  }

  return (
    <form action={createSale} className="card max-w-xl space-y-4">
      <div>
        <label>Product</label>
        <select
          name="productId"
          value={productId}
          onChange={(e) => onProductChange(Number(e.target.value))}
          required
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.stock} in stock
            </option>
          ))}
        </select>
        {selected && (
          <p className="mt-1 text-xs text-gray-500">
            In stock: <b>{selected.stock}</b> pieces · suggested price{" "}
            {money(selected.sellPricePerUnit)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Quantity sold (pieces)</label>
          <input
            name="quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          />
        </div>
        <div>
          <label>Price per piece</label>
          <input
            name="unitPrice"
            type="number"
            step="0.01"
            min={0}
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <label>Sale date</label>
        <input name="saleDate" type="date" defaultValue={today} />
      </div>

      <div className="rounded-xl bg-emerald-50 p-4 text-center">
        <div className="text-xs uppercase tracking-wide text-emerald-700">
          Total sale
        </div>
        <div className="text-2xl font-bold text-emerald-700">
          {money(total)}
        </div>
      </div>

      {selected && quantity > selected.stock && (
        <p className="text-sm text-amber-600">
          ⚠️ You&apos;re selling more than the {selected.stock} pieces in stock.
        </p>
      )}

      <div className="flex gap-2 pt-2">
        <button type="submit" className="btn btn-primary">
          Record sale
        </button>
        <Link href="/sales" className="btn btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
