"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";
import DeleteForm from "@/components/DeleteForm";

export type CategoryRowData = {
  id: number;
  name: string;
  depth: number;
  parentId: number | null;
  childCount: number;
  productCount: number;
};

const indent = (depth: number) =>
  "  ".repeat(depth * 2) + (depth > 0 ? "└ " : "");

/** ids of a category and everything nested under it */
function subtreeIds(rows: CategoryRowData[], id: number): Set<number> {
  const ids = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const r of rows) {
      if (r.parentId !== null && ids.has(r.parentId) && !ids.has(r.id)) {
        ids.add(r.id);
        grew = true;
      }
    }
  }
  return ids;
}

export default function CategoryTable({
  rows,
  updateAction,
  deleteAction,
}: {
  /** flattened tree, parents first */
  rows: CategoryRowData[];
  updateAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
}) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3 text-right">Products</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((r) => (
            <Row
              key={r.id}
              row={r}
              rows={rows}
              updateAction={updateAction}
              deleteAction={deleteAction}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({
  row: r,
  rows,
  updateAction,
  deleteAction,
}: {
  row: CategoryRowData;
  rows: CategoryRowData[];
  updateAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    // valid new parents: everything except this category and its descendants
    const excluded = subtreeIds(rows, r.id);
    return (
      <tr className="bg-emerald-50/40">
        <td colSpan={3} className="px-4 py-3">
          <form
            action={updateAction}
            onSubmit={() => setEditing(false)}
            className="flex flex-wrap items-center gap-2"
            style={{ paddingLeft: `${r.depth * 1.5}rem` }}
          >
            <input type="hidden" name="id" value={r.id} />
            <div className="w-48">
              <input name="name" defaultValue={r.name} required />
            </div>
            <div className="w-56">
              <select name="parentId" defaultValue={r.parentId ?? ""}>
                <option value="">— Top level —</option>
                {rows
                  .filter((o) => !excluded.has(o.id))
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {indent(o.depth)}
                      {o.name}
                    </option>
                  ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setEditing(false)}
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
        <div
          className="flex items-center gap-2"
          style={{ paddingLeft: `${r.depth * 1.5}rem` }}
        >
          {r.depth > 0 && <span className="text-gray-300">└</span>}
          <span
            className={
              r.depth === 0
                ? "font-semibold text-gray-900"
                : r.childCount > 0
                ? "font-medium text-gray-800"
                : "text-gray-600"
            }
          >
            {r.name}
          </span>
          {r.childCount > 0 && <Badge tone="blue">{r.childCount} sub</Badge>}
        </div>
      </td>
      <td className="px-4 py-3 text-right text-gray-600">{r.productCount}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
          <button
            onClick={() => setEditing(true)}
            className="text-emerald-600 hover:underline"
          >
            Edit
          </button>
          <DeleteForm
            action={deleteAction}
            id={r.id}
            message={
              `Delete category "${r.name}"?` +
              (r.childCount > 0
                ? ` Its ${r.childCount} sub-categories will move up one level.`
                : "") +
              (r.productCount > 0
                ? ` Its ${r.productCount} products will become uncategorized (not deleted).`
                : "")
            }
          />
        </div>
      </td>
    </tr>
  );
}
