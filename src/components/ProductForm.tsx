"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createProduct, updateProduct } from "@/app/actions";
import { computePricing, money } from "@/lib/calc";

type Category = { id: number; name: string; parentId: number | null };
type ProductData = {
  id: number;
  name: string;
  categoryId: number | null;
  supplier: string | null;
  purchaseDate: string; // yyyy-mm-dd
  packs: number;
  unitsPerPack: number;
  purchasePrice: number;
  marginPercent: number;
  expirationDate: string | null; // yyyy-mm-dd
  note: string | null;
  lowStockThreshold: number;
  invoiceImageUrl: string | null;
};

/**
 * Cascading category picker: one small select per level instead of one
 * huge indented list. The deepest selection is submitted as categoryId.
 */
function CategoryPicker({
  categories,
  initialId,
}: {
  categories: Category[];
  initialId: number | null;
}) {
  const byId = new Map(categories.map((c) => [c.id, c]));

  // Path of ids from top level down to the initially selected category.
  const initialPath: number[] = [];
  let cur = initialId;
  while (cur !== null && byId.has(cur)) {
    initialPath.unshift(cur);
    cur = byId.get(cur)!.parentId;
  }
  const [path, setPath] = useState<number[]>(initialPath);

  // One select per level, as long as the previous level has a selection.
  const levels: { options: Category[]; selected: number | "" }[] = [];
  let parent: number | null = null;
  for (let i = 0; ; i++) {
    const options = categories.filter((c) => c.parentId === parent);
    if (options.length === 0) break;
    const selected: number | "" = i < path.length ? path[i] : "";
    levels.push({ options, selected });
    if (selected === "") break;
    parent = selected;
  }

  const deepest = path.length > 0 ? path[path.length - 1] : "";

  return (
    <div className="space-y-2">
      <input type="hidden" name="categoryId" value={deepest} />
      {levels.map((lvl, i) => (
        <select
          key={i}
          value={lvl.selected}
          onChange={(e) => {
            const v = e.target.value;
            setPath(
              v === "" ? path.slice(0, i) : [...path.slice(0, i), Number(v)]
            );
          }}
        >
          <option value="">
            {i === 0
              ? "— Choose category —"
              : `— All of ${byId.get(path[i - 1])?.name ?? ""} —`}
          </option>
          {lvl.options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}

/** [-] number [+] stepper for quick tapping. */
function Stepper({
  name,
  value,
  onChange,
  min = 1,
}: {
  name: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div className="flex">
      <button
        type="button"
        className="mac-step"
        aria-label="minus"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <input
        name={name}
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value)))}
        className="!w-full border-x-0 text-center"
      />
      <button
        type="button"
        className="mac-step"
        aria-label="plus"
        onClick={() => onChange(value + 1)}
      >
        ＋
      </button>
    </div>
  );
}

function MacWindow({
  title,
  closeHref,
  children,
  className,
}: {
  title: string;
  closeHref?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mac-window ${className ?? ""}`}>
      <div className="mac-titlebar">
        {closeHref ? (
          <Link href={closeHref} aria-label="Close" className="mac-close" />
        ) : (
          <span className="mac-close" style={{ visibility: "hidden" }} />
        )}
        <span className="mac-title">{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: ProductData;
}) {
  const isEdit = !!product;
  const today = new Date().toISOString().slice(0, 10);

  const [packs, setPacks] = useState(product?.packs ?? 1);
  const [unitsPerPack, setUnitsPerPack] = useState(product?.unitsPerPack ?? 1);
  const [purchasePrice, setPurchasePrice] = useState(
    product?.purchasePrice ?? 0
  );
  const [margin, setMargin] = useState(product?.marginPercent ?? 20);
  const [preview, setPreview] = useState<string | null>(null);

  const pricing = useMemo(
    () =>
      computePricing({
        packs,
        unitsPerPack,
        purchasePrice,
        marginPercent: margin,
      }),
    [packs, unitsPerPack, purchasePrice, margin]
  );

  return (
    <div className="mac">
      <form
        action={isEdit ? updateProduct : createProduct}
      >
        {isEdit && <input type="hidden" name="id" value={product!.id} />}

        <MacWindow
          title={isEdit ? `Edit \u201c${product!.name}\u201d` : "New Product"}
          closeHref="/products"
        >
          {/* One screen, three panels — no scrolling to save. */}
          <div className="grid grid-cols-1 items-start gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {/* ----------------------- 1 · Product ----------------------- */}
            <fieldset className="mac-fieldset space-y-3">
              <legend className="mac-legend">1 · THE PRODUCT</legend>
              <div>
                <label>Name</label>
                <input
                  name="name"
                  autoFocus
                  required
                  defaultValue={product?.name}
                  placeholder="e.g. Sidi Ali water 1.5L"
                />
              </div>
              <div>
                <label>Category</label>
                <CategoryPicker
                  categories={categories}
                  initialId={product?.categoryId ?? null}
                />
              </div>
              <div>
                <label>…or type a new category</label>
                <input name="newCategory" placeholder="e.g. Drinks" />
              </div>
              <div>
                <label>Supplier (fournisseur)</label>
                <input
                  name="supplier"
                  defaultValue={product?.supplier ?? ""}
                  placeholder="e.g. Marjane / Metro"
                />
              </div>
            </fieldset>

            {/* ----------------------- 2 · Purchase ---------------------- */}
            <fieldset className="mac-fieldset space-y-3">
              <legend className="mac-legend">2 · WHAT YOU BOUGHT</legend>
              <div>
                <label>Purchase date</label>
                <input
                  name="purchaseDate"
                  type="date"
                  defaultValue={product?.purchaseDate ?? today}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label>Packs</label>
                  <Stepper name="packs" value={packs} onChange={setPacks} />
                </div>
                <div>
                  <label>Pieces / pack</label>
                  <Stepper
                    name="unitsPerPack"
                    value={unitsPerPack}
                    onChange={setUnitsPerPack}
                  />
                </div>
              </div>
              <div className="border-2 border-dashed border-gray-900 px-3 py-1.5 text-center text-sm">
                = <b>{pricing.totalUnits}</b> pieces in total
              </div>
              <div>
                <label>Total price you paid</label>
                <input
                  name="purchasePrice"
                  type="number"
                  step="0.01"
                  min={0}
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label>Your margin %</label>
                <input
                  name="marginPercent"
                  type="number"
                  step="0.1"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                />
              </div>
              <div className="mac-invert px-3 py-1.5 text-center text-sm">
                sell 1 piece at <b>{money(pricing.sellPricePerUnit)}</b>
              </div>
            </fieldset>

            {/* ----------------------- 3 · Extras ------------------------ */}
            <fieldset className="mac-fieldset space-y-3 md:col-span-2 xl:col-span-1">
              <legend className="mac-legend">3 · EXTRAS (OPTIONAL)</legend>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label>Expiration date</label>
                  <input
                    name="expirationDate"
                    type="date"
                    defaultValue={product?.expirationDate ?? ""}
                  />
                </div>
                <div>
                  <label>Low-stock alert (pcs)</label>
                  <input
                    name="lowStockThreshold"
                    type="number"
                    min={0}
                    defaultValue={product?.lowStockThreshold ?? 10}
                  />
                </div>
              </div>
              <div>
                <label>
                  Invoice photo {isEdit ? "(empty = keep current)" : ""}
                </label>
                <input
                  name="invoice"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setPreview(f ? URL.createObjectURL(f) : null);
                  }}
                />
              </div>
              <div>
                <label>Note</label>
                <textarea
                  name="note"
                  rows={2}
                  defaultValue={product?.note ?? ""}
                  placeholder="Anything to remember…"
                />
              </div>
              {(preview || product?.invoiceImageUrl) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview ?? product?.invoiceImageUrl ?? ""}
                  alt="invoice"
                  className="max-h-24 border-2 border-gray-900 object-contain"
                />
              )}
            </fieldset>
          </div>

          {/* --------- Status bar: the live math + the buttons ---------- */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-gray-900 px-4 py-3">
            <div className="pixel flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span>
                Pieces: <b>{pricing.totalUnits}</b>
              </span>
              <span>
                Cost/pc: <b>{money(pricing.costPerUnit)}</b>
              </span>
              <span>
                Sell/pc: <b>{money(pricing.sellPricePerUnit)}</b>
              </span>
              <span>
                Profit/pc: <b>{money(pricing.profitPerUnit)}</b>
              </span>
              <span className="mac-invert px-2 py-0.5">
                Total profit: <b>{money(pricing.expectedProfit)}</b>
              </span>
            </div>
            <div className="flex items-center gap-5">
              <Link href="/products" className="btn btn-ghost">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary">
                Save
              </button>
            </div>
          </div>
        </MacWindow>
      </form>
    </div>
  );
}
