"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createProduct, updateProduct } from "@/app/actions";
import { computePricing, money } from "@/lib/calc";
import BarcodeScanner from "@/components/BarcodeScanner";
import { translator, type Lang } from "@/lib/i18n";
import { compressInputFile } from "@/lib/compressImage";
import { SubmitWithProgress } from "@/components/FormPending";

type Category = { id: number; name: string; parentId: number | null };
type SupplierOpt = { id: number; name: string };
export type InvoiceOpt = {
  id: number;
  supplierId: number;
  number: string;
  dateStr: string; // yyyy-mm-dd
  totalAmount: number;
  enteredSum: number; // sum of items already on the facture
};
type ProductData = {
  id: number;
  name: string;
  variant: string | null;
  barcode: string | null;
  categoryId: number | null;
  supplierId: number | null;
  invoiceId: number | null;
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

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function ProductForm({
  categories,
  suppliers,
  invoices = [],
  product,
  copyFrom,
  initialInvoiceId,
  lang,
}: {
  categories: Category[];
  suppliers: SupplierOpt[];
  invoices?: InvoiceOpt[];
  product?: ProductData;
  /** Pre-fill from an existing product (variant duplication). */
  copyFrom?: ProductData;
  /** Pre-select a facture (e.g. arriving from the Invoices page). */
  initialInvoiceId?: number | null;
  lang?: Lang;
}) {
  const tr = translator(lang ?? "en");
  const isEdit = !!product;
  const base = product ?? copyFrom;
  const today = new Date().toISOString().slice(0, 10);

  const [packs, setPacks] = useState(base?.packs ?? 1);
  const [unitsPerPack, setUnitsPerPack] = useState(base?.unitsPerPack ?? 1);

  // Prices and margin are kept as STRINGS so the fields can start empty
  // and the user can freely delete digits — no sticky leading zero.
  const [purchasePriceStr, setPurchasePriceStr] = useState(
    base && base.purchasePrice ? String(base.purchasePrice) : ""
  );
  const [packPriceStr, setPackPriceStr] = useState(
    base && base.packs > 0 && base.purchasePrice
      ? String(round2(base.purchasePrice / base.packs))
      : ""
  );
  const [marginStr, setMarginStr] = useState(
    base ? String(base.marginPercent) : "20"
  );
  const dec = (x: string) => parseFloat(x.replace(",", "."));
  const purchasePrice = dec(purchasePriceStr) || 0;
  const packPrice = dec(packPriceStr) || 0;
  const margin = dec(marginStr) || 0;

  const [barcode, setBarcode] = useState(base?.barcode ?? "");
  const [preview, setPreview] = useState<string | null>(null);

  // Supplier → facture cascade, with automatic date fill.
  const presetInvoiceId = product?.invoiceId ?? initialInvoiceId ?? null;
  const presetInvoice = invoices.find((i) => i.id === presetInvoiceId);
  const [supplierSel, setSupplierSel] = useState<string>(
    String(base?.supplierId ?? presetInvoice?.supplierId ?? "")
  );
  const [invoiceSel, setInvoiceSel] = useState<string>(
    presetInvoiceId ? String(presetInvoiceId) : ""
  );
  const [purchaseDate, setPurchaseDate] = useState(
    product?.purchaseDate || presetInvoice?.dateStr || today
  );

  const changePacks = (v: number) => {
    setPacks(v);
    if (packPrice > 0) setPurchasePriceStr(String(round2(v * packPrice)));
  };
  const changePackPrice = (s: string) => {
    setPackPriceStr(s);
    const n = dec(s);
    setPurchasePriceStr(isNaN(n) ? "" : String(round2(packs * n)));
  };
  const changeTotal = (s: string) => {
    setPurchasePriceStr(s);
    const n = dec(s);
    setPackPriceStr(isNaN(n) || packs <= 0 ? "" : String(round2(n / packs)));
  };

  // The intelligent part: how much of the facture total is still
  // missing, live, counting what's being typed right now.
  const selInv = invoices.find((i) => String(i.id) === invoiceSel);
  let remaining: number | null = null;
  if (selInv && selInv.totalAmount > 0) {
    const alreadyEntered =
      selInv.enteredSum -
      (isEdit && product?.invoiceId === selInv.id ? product.purchasePrice : 0);
    remaining = round2(selInv.totalAmount - alreadyEntered - purchasePrice);
  }

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
          title={isEdit ? `Edit \u201c${product!.name}\u201d` : tr("form.newProduct")}
          closeHref="/products"
        >
          {/* One screen, three panels — no scrolling to save. */}
          <div className="grid grid-cols-1 items-start gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {/* ----------------------- 1 · Product ----------------------- */}
            <fieldset className="mac-fieldset space-y-3">
              <legend className="mac-legend">{tr("form.theProduct")}</legend>
              <div>
                <label>{tr("form.name")}</label>
                <input
                  name="name"
                  autoFocus
                  required
                  defaultValue={base?.name}
                  placeholder="e.g. Sidi Ali water 1.5L"
                />
              </div>
              <div>
                <label>{tr("form.variant")}</label>
                <input
                  name="variant"
                  defaultValue={product?.variant ?? ""}
                  placeholder={tr("form.variantPh")}
                />
              </div>
              <div>
                <label>{tr("form.barcode")}</label>
                <div className="flex gap-2">
                  <input
                    name="barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder={tr("form.barcodePh")}
                  />
                  <BarcodeScanner onScan={setBarcode} />
                </div>
              </div>
              <div>
                <label>{tr("form.category")}</label>
                <CategoryPicker
                  categories={categories}
                  initialId={base?.categoryId ?? null}
                />
              </div>
              <div>
                <label>{tr("form.newCategory")}</label>
                <input name="newCategory" placeholder="e.g. Drinks" />
              </div>
            </fieldset>

            {/* ----------------------- 2 · Purchase ---------------------- */}
            <fieldset className="mac-fieldset space-y-3">
              <legend className="mac-legend">{tr("form.whatYouBought")}</legend>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label>{tr("form.supplier")}</label>
                  <select
                    name="supplierId"
                    value={supplierSel}
                    onChange={(e) => {
                      setSupplierSel(e.target.value);
                      setInvoiceSel("");
                    }}
                  >
                    <option value="">{tr("form.choose")}</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>{tr("form.newSupplier")}</label>
                  <input name="newSupplier" placeholder="e.g. Metro" />
                </div>
              </div>
              {supplierSel && (
                <div>
                  <label className="flex items-center justify-between">
                    <span>{tr("form.facture")}</span>
                    <Link
                      href="/invoices"
                      className="text-xs font-medium text-emerald-600 hover:underline"
                    >
                      {tr("form.newFactureLink")}
                    </Link>
                  </label>
                  <select
                    name="invoiceId"
                    value={invoiceSel}
                    onChange={(e) => {
                      const v = e.target.value;
                      setInvoiceSel(v);
                      const inv = invoices.find((i) => String(i.id) === v);
                      if (inv) setPurchaseDate(inv.dateStr);
                    }}
                  >
                    <option value="">{tr("form.noFacture")}</option>
                    {invoices
                      .filter((i) => String(i.supplierId) === supplierSel)
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.number} · {i.dateStr}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              <div>
                <label>{tr("form.purchaseDate")}</label>
                <input
                  name="purchaseDate"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label>{tr("form.packs")}</label>
                  <Stepper name="packs" value={packs} onChange={changePacks} />
                </div>
                <div>
                  <label>{tr("form.piecesPerPack")}</label>
                  <Stepper
                    name="unitsPerPack"
                    value={unitsPerPack}
                    onChange={setUnitsPerPack}
                  />
                </div>
              </div>
              <div className="border-2 border-dashed border-gray-900 px-3 py-1.5 text-center text-sm">
                = <b>{pricing.totalUnits}</b> {tr("form.piecesTotal")}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label>{tr("form.pricePerPack")}</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={packPriceStr}
                    onChange={(e) => changePackPrice(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label>{tr("form.totalPaid")}</label>
                  <input
                    name="purchasePrice"
                    type="text"
                    inputMode="decimal"
                    value={purchasePriceStr}
                    onChange={(e) => changeTotal(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div>
                <label>{tr("form.margin")}</label>
                <input
                  name="marginPercent"
                  type="text"
                  inputMode="decimal"
                  value={marginStr}
                  onChange={(e) => setMarginStr(e.target.value)}
                />
              </div>
              <div className="mac-invert px-3 py-1.5 text-center text-sm">
                {tr("form.sellAt")} <b>{money(pricing.sellPricePerUnit)}</b>
              </div>
              {remaining !== null && (
                <div
                  className={`border-2 px-3 py-2 text-center text-sm font-semibold ${
                    remaining < -0.01
                      ? "border-red-500 text-red-600"
                      : remaining < 0.01
                      ? "border-emerald-600 text-emerald-700"
                      : "border-amber-500 text-amber-700"
                  }`}
                >
                  {remaining < -0.01
                    ? tr("form.factureOver")
                    : remaining < 0.01
                    ? tr("inv.complete")
                    : `${money(remaining)} ${tr("form.factureRemaining")}`}
                </div>
              )}
            </fieldset>

            {/* ----------------------- 3 · Extras ------------------------ */}
            <fieldset className="mac-fieldset space-y-3 md:col-span-2 xl:col-span-1">
              <legend className="mac-legend">{tr("form.extras")}</legend>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label>{tr("form.expiration")}</label>
                  <input
                    name="expirationDate"
                    type="date"
                    defaultValue={product?.expirationDate ?? ""}
                  />
                </div>
                <div>
                  <label>{tr("form.lowStock")}</label>
                  <input
                    name="lowStockThreshold"
                    type="number"
                    min={0}
                    defaultValue={base?.lowStockThreshold ?? 10}
                  />
                </div>
              </div>
              <div>
                <label>
                  {tr("form.invoice")} {isEdit ? tr("form.keepCurrent") : ""}
                </label>
                <input
                  name="invoice"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    await compressInputFile(e.currentTarget);
                    const f = e.currentTarget.files?.[0];
                    setPreview(f ? URL.createObjectURL(f) : null);
                  }}
                />
              </div>
              <div>
                <label>{tr("form.note")}</label>
                <textarea
                  name="note"
                  rows={2}
                  defaultValue={product?.note ?? ""}
                  placeholder={tr("form.notePh")}
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
                {tr("form.pieces")}: <b>{pricing.totalUnits}</b>
              </span>
              <span>
                {tr("form.costPc")}: <b>{money(pricing.costPerUnit)}</b>
              </span>
              <span>
                {tr("form.sellPc")}: <b>{money(pricing.sellPricePerUnit)}</b>
              </span>
              <span>
                {tr("form.profitPc")}: <b>{money(pricing.profitPerUnit)}</b>
              </span>
              <span className="mac-invert px-2 py-0.5">
                {tr("form.totalProfit")}: <b>{money(pricing.expectedProfit)}</b>
              </span>
            </div>
            <div className="flex items-center gap-5">
              <Link href="/products" className="btn btn-ghost">
                {tr("common.cancel")}
              </Link>
              <SubmitWithProgress
                label={tr("common.save")}
                pendingLabel={tr("inv.uploading")}
                className="!w-auto"
              />
            </div>
          </div>
        </MacWindow>
      </form>
    </div>
  );
}
