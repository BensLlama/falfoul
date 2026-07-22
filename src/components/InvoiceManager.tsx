"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { MacAlert } from "@/components/MacDialog";
import { PixelIcon } from "@/components/PixelIcon";
import { useLang } from "@/lib/useLang";
import { translator } from "@/lib/i18n";

export type InvoiceRow = {
  id: number;
  supplierName: string;
  number: string;
  dateStr: string; // yyyy-mm-dd
  dateLabel: string;
  place: string | null;
  totalAmount: number;
  enteredSum: number;
  itemCount: number;
  imageUrl: string | null;
  totalStr: string;
  enteredStr: string;
  remainingStr: string;
};

type Action = (formData: FormData) => void;
type SupplierOpt = { id: number; name: string };

export default function InvoiceManager({
  invoices,
  suppliers,
  create,
  update,
  remove,
}: {
  invoices: InvoiceRow[];
  suppliers: SupplierOpt[];
  create: Action;
  update: Action;
  remove: Action;
}) {
  const tr = translator(useLang());
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
      {/* --- Add form --- */}
      <form action={create} className="card h-fit space-y-4">
        <div className="pixel text-base font-semibold text-gray-700">
          {tr("inv.add")}
        </div>
        <div>
          <label>{tr("form.supplier")}</label>
          <select name="supplierId" required defaultValue="">
            <option value="">{tr("form.choose")}</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>{tr("inv.number")}</label>
          <input name="number" required placeholder="e.g. FA-2026-105" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label>{tr("inv.date")}</label>
            <input name="date" type="date" defaultValue={today} />
          </div>
          <div>
            <label>{tr("inv.total")}</label>
            <input
              name="totalAmount"
              type="number"
              step="0.01"
              min={0}
              placeholder="0.00"
            />
          </div>
        </div>
        <div>
          <label>{tr("inv.place")}</label>
          <input name="place" placeholder="e.g. Marché de gros" />
        </div>
        <div>
          <label>{tr("inv.photo")}</label>
          <input name="image" type="file" accept="image/*" capture="environment" />
        </div>
        <button type="submit" className="btn btn-primary w-full">
          {tr("inv.addBtn")}
        </button>
      </form>

      {/* --- Facture cards --- */}
      {invoices.length === 0 ? (
        <div className="card py-12 text-center text-base text-gray-500">
          {tr("inv.none")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {invoices.map((inv) => (
            <InvoiceCard
              key={inv.id}
              inv={inv}
              update={update}
              remove={remove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceCard({
  inv,
  update,
  remove,
}: {
  inv: InvoiceRow;
  update: Action;
  remove: Action;
}) {
  const tr = translator(useLang());
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const delRef = useRef<HTMLFormElement>(null);

  const remaining = inv.totalAmount - inv.enteredSum;
  const pct =
    inv.totalAmount > 0
      ? Math.min(100, Math.round((inv.enteredSum / inv.totalAmount) * 100))
      : 0;
  const complete = inv.totalAmount > 0 && Math.abs(remaining) < 0.01;
  const over = remaining < -0.01;

  return (
    <div className="card space-y-3 !p-4">
      <div className="flex items-start gap-3">
        {inv.imageUrl ? (
          <a href={inv.imageUrl} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={inv.imageUrl}
              alt="facture"
              className="h-16 w-16 border-2 border-gray-900 object-cover"
            />
          </a>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center border-2 border-gray-200 bg-gray-50 text-gray-300">
            <PixelIcon name="doc" size={32} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="pixel truncate text-lg font-semibold text-gray-900">
            {inv.number}
          </div>
          <div className="text-sm text-gray-500">
            {inv.supplierName} · {inv.dateLabel}
            {inv.place ? ` · ${inv.place}` : ""}
          </div>
          <div className="text-sm text-gray-500">
            {inv.itemCount} {tr("inv.items")}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setEditing(!editing)}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-emerald-600"
            title={tr("common.edit")}
          >
            <PixelIcon name="pencil" size={14} />
          </button>
          <form action={remove} ref={delRef} className="inline-flex">
            <input type="hidden" name="id" value={inv.id} />
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
              title={tr("common.delete")}
            >
              <PixelIcon name="cross" size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* --- entered vs total --- */}
      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {inv.enteredStr} / {inv.totalStr} {tr("inv.entered")}
          </span>
          <span className="pixel font-semibold">{pct}%</span>
        </div>
        <div className="h-4 w-full border-2 border-gray-900 bg-white">
          <div
            className={`h-full ${
              over ? "bg-red-400" : complete ? "bg-emerald-500" : "bg-amber-400"
            }`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <div className="mt-1.5 text-sm font-medium">
          {complete ? (
            <span className="text-emerald-600">{tr("inv.complete")}</span>
          ) : over ? (
            <span className="text-red-600">
              {inv.remainingStr} {tr("inv.over")}
            </span>
          ) : (
            <span className="text-amber-600">
              {inv.remainingStr} {tr("inv.remaining")}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t-2 border-dashed border-gray-200 pt-2.5">
        <Link
          href={`/products/new?invoice=${inv.id}`}
          className="btn btn-primary !py-1.5 !text-sm"
        >
          {tr("inv.addItem")}
        </Link>
      </div>

      {editing && (
        <form
          action={update}
          onSubmit={() => setEditing(false)}
          className="space-y-3 border-t-2 border-dashed border-gray-200 pt-3"
        >
          <input type="hidden" name="id" value={inv.id} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>{tr("inv.number")}</label>
              <input name="number" defaultValue={inv.number} required />
            </div>
            <div>
              <label>{tr("inv.date")}</label>
              <input name="date" type="date" defaultValue={inv.dateStr} />
            </div>
            <div>
              <label>{tr("inv.total")}</label>
              <input
                name="totalAmount"
                type="number"
                step="0.01"
                min={0}
                defaultValue={inv.totalAmount || ""}
              />
            </div>
            <div>
              <label>{tr("inv.place")}</label>
              <input name="place" defaultValue={inv.place ?? ""} />
            </div>
          </div>
          <div>
            <label>{tr("inv.photo")}</label>
            <input name="image" type="file" accept="image/*" capture="environment" />
          </div>
          <div className="flex gap-3">
            <button className="btn btn-primary !py-1.5 !text-sm">
              {tr("common.save")}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn btn-ghost !py-1.5 !text-sm"
            >
              {tr("common.cancel")}
            </button>
          </div>
        </form>
      )}

      {confirming && (
        <MacAlert
          message={`${tr("common.delete")} "${inv.number}"? ${tr("inv.deleteMsg")}`}
          confirmLabel={tr("common.delete")}
          danger
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            delRef.current?.requestSubmit();
          }}
        />
      )}
    </div>
  );
}
