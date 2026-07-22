"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { MacAlert } from "@/components/MacDialog";
import { useLang } from "@/lib/useLang";
import { translator } from "@/lib/i18n";

export type SupplierRow = {
  id: number;
  name: string;
  phone: string | null;
  note: string | null;
  productCount: number;
  invoiceCount: number;
};

type Action = (formData: FormData) => void;

export default function SupplierManager({
  suppliers,
  create,
  update,
  remove,
}: {
  suppliers: SupplierRow[];
  create: Action;
  update: Action;
  remove: Action;
}) {
  const tr = translator(useLang());
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      {/* --- Add form --- */}
      <form action={create} className="card h-fit space-y-4">
        <div className="pixel text-sm font-semibold text-gray-700">
          {tr("sup.add")}
        </div>
        <div>
          <label>{tr("form.name")}</label>
          <input name="name" required placeholder="e.g. Metro Wholesale" />
        </div>
        <div>
          <label>{tr("sup.phone")}</label>
          <input name="phone" placeholder="e.g. 06 12 34 56 78" />
        </div>
        <div>
          <label>{tr("sup.noteOpt")}</label>
          <input name="note" placeholder="Delivery days, contact…" />
        </div>
        <button type="submit" className="btn btn-primary w-full">
          {tr("sup.addBtn")}
        </button>
      </form>

      {/* --- List --- */}
      {suppliers.length === 0 ? (
        <div className="card py-10 text-center text-sm text-gray-500">
          {tr("sup.none")}
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b-2 border-gray-900 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">{tr("table.supplier")}</th>
                <th className="px-4 py-3">{tr("sup.phone")}</th>
                <th className="px-4 py-3 text-right">{tr("sup.products")}</th>
                <th className="px-4 py-3 text-right">{tr("nav.invoices")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.map((s) => (
                <Row key={s.id} s={s} update={update} remove={remove} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({
  s,
  update,
  remove,
}: {
  s: SupplierRow;
  update: Action;
  remove: Action;
}) {
  const tr = translator(useLang());
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const delRef = useRef<HTMLFormElement>(null);

  if (editing) {
    return (
      <tr className="bg-emerald-50/40">
        <td colSpan={5} className="px-4 py-3">
          <form
            action={update}
            onSubmit={() => setEditing(false)}
            className="flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="id" value={s.id} />
            <div className="w-44">
              <input name="name" defaultValue={s.name} required />
            </div>
            <div className="w-36">
              <input name="phone" defaultValue={s.phone ?? ""} placeholder="Phone" />
            </div>
            <div className="w-44">
              <input name="note" defaultValue={s.note ?? ""} placeholder="Note" />
            </div>
            <button className="btn btn-primary !px-3 !py-1.5 !text-xs">{tr("common.save")}</button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn btn-ghost !px-3 !py-1.5 !text-xs"
            >
              {tr("common.cancel")}
            </button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50/60">
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{s.name}</div>
        {s.note && <div className="text-xs text-gray-400">{s.note}</div>}
      </td>
      <td className="px-4 py-3 text-gray-600">
        {s.phone ? (
          <a href={`tel:${s.phone}`} className="hover:underline">
            {s.phone}
          </a>
        ) : (
          "—"
        )}
      </td>
      <td className="px-4 py-3 text-right text-gray-600">{s.productCount}</td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/invoices?supplier=${s.id}`}
          className="font-medium text-emerald-600 hover:underline"
        >
          {s.invoiceCount}
        </Link>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
          <button
            onClick={() => setEditing(true)}
            className="text-emerald-600 hover:underline"
          >
            {tr("common.edit")}
          </button>
          <form action={remove} ref={delRef} className="inline-flex">
            <input type="hidden" name="id" value={s.id} />
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-red-500 hover:underline"
            >
              {tr("common.delete")}
            </button>
          </form>
          {confirming && (
            <MacAlert
              message={
                `${tr("common.delete")} "${s.name}"?` +
                (s.productCount > 0
                  ? ` ${s.productCount} ${tr("sup.products").toLowerCase()} ${tr("sup.deleteMsg")}.`
                  : "")
              }
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
      </td>
    </tr>
  );
}
