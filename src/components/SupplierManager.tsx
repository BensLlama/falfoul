"use client";

import { useRef, useState } from "react";
import { MacAlert } from "@/components/MacDialog";

export type SupplierRow = {
  id: number;
  name: string;
  phone: string | null;
  note: string | null;
  productCount: number;
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
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      {/* --- Add form --- */}
      <form action={create} className="card h-fit space-y-4">
        <div className="pixel text-sm font-semibold text-gray-700">
          ➕ Add a supplier
        </div>
        <div>
          <label>Name</label>
          <input name="name" required placeholder="e.g. Metro Wholesale" />
        </div>
        <div>
          <label>Phone (optional)</label>
          <input name="phone" placeholder="e.g. 06 12 34 56 78" />
        </div>
        <div>
          <label>Note (optional)</label>
          <input name="note" placeholder="Delivery days, contact…" />
        </div>
        <button type="submit" className="btn btn-primary w-full">
          Add supplier
        </button>
      </form>

      {/* --- List --- */}
      {suppliers.length === 0 ? (
        <div className="card py-10 text-center text-sm text-gray-500">
          No suppliers yet — add your first fournisseur with the form.
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b-2 border-gray-900 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3 text-right">Products</th>
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
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const delRef = useRef<HTMLFormElement>(null);

  if (editing) {
    return (
      <tr className="bg-emerald-50/40">
        <td colSpan={4} className="px-4 py-3">
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
            <button className="btn btn-primary !px-3 !py-1.5 !text-xs">Save</button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn btn-ghost !px-3 !py-1.5 !text-xs"
            >
              Cancel
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
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
          <button
            onClick={() => setEditing(true)}
            className="text-emerald-600 hover:underline"
          >
            Edit
          </button>
          <form action={remove} ref={delRef} className="inline-flex">
            <input type="hidden" name="id" value={s.id} />
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-red-500 hover:underline"
            >
              Delete
            </button>
          </form>
          {confirming && (
            <MacAlert
              message={
                `Delete supplier "${s.name}"?` +
                (s.productCount > 0
                  ? ` Its ${s.productCount} products stay but lose the supplier link.`
                  : "")
              }
              confirmLabel="Delete"
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
