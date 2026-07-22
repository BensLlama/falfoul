"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui";
import DeleteForm from "@/components/DeleteForm";
import { PixelIcon } from "@/components/PixelIcon";
import BarcodeScanner from "@/components/BarcodeScanner";
import { useLang } from "@/lib/useLang";
import { translator } from "@/lib/i18n";

export type ProductRow = {
  id: number;
  name: string;
  variant: string | null;
  barcode: string | null;
  category: string;
  supplier: string | null;
  purchaseDateStr: string;
  packs: number;
  unitsPerPack: number;
  bought: number;
  paidStr: string;
  costStr: string;
  sellStr: string;
  marginPercent: number;
  stock: number;
  isOut: boolean;
  isLow: boolean;
  expiryStr: string | null;
  expiryTone: "gray" | "red" | "amber" | "blue";
  invoiceImageUrl: string | null;
};

export default function ProductTable({
  rows,
  deleteAction,
}: {
  rows: ProductRow[];
  deleteAction: (formData: FormData) => void;
}) {
  const tr = translator(useLang());
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = q
    ? rows.filter((p) =>
        [p.name, p.variant ?? "", p.barcode ?? "", p.category, p.supplier ?? ""].some(
          (s) => s.toLowerCase().includes(q)
        )
      )
    : rows;

  return (
    <div>
      <div className="mb-4 flex max-w-md items-center gap-2">
        <div className="relative flex-1">
          <PixelIcon
            name="search"
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr("table.searchPh")}
            className="!pl-9"
          />
        </div>
        <BarcodeScanner onScan={setQuery} label="" />
      </div>

      {/* --- Phone: stacked cards --- */}
      <div className="space-y-3 md:hidden">
        {visible.length === 0 && (
          <div className="card py-8 text-center text-sm text-gray-500">
            {tr("table.noMatch")} “{query}”.
          </div>
        )}
        {visible.map((p) => (
          <div key={p.id} className="card space-y-2 !p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-semibold text-gray-900">
                  {p.name}
                  {p.variant && (
                    <span className="ml-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-normal text-blue-700">
                      {p.variant}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {p.category}
                  {p.supplier ? ` · ${p.supplier}` : ""}
                  {p.barcode ? ` · ${p.barcode}` : ""}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="pixel font-semibold">{p.stock}</span>
                {p.isOut ? (
                  <Badge tone="red">{tr("common.out")}</Badge>
                ) : p.isLow ? (
                  <Badge tone="amber">{tr("common.low")}</Badge>
                ) : (
                  <span className="text-xs text-gray-400">pcs</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700">
              <span>
                {tr("table.sell")}:{" "}
                <b className="text-emerald-600">{p.sellStr}</b>
              </span>
              <span>{tr("table.cost")}: {p.costStr}</span>
              <span>
                {p.packs}×{p.unitsPerPack} = {p.bought} pcs
              </span>
            </div>
            <div className="flex items-center justify-between border-t-2 border-dashed border-gray-200 pt-2">
              {p.expiryStr ? (
                <Badge tone={p.expiryTone}>{p.expiryStr}</Badge>
              ) : (
                <span className="text-xs text-gray-300">{tr("table.noExpiry")}</span>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Link
                  href={`/products/new?copy=${p.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {tr("common.duplicate")}
                </Link>
                <Link
                  href={`/products/${p.id}/edit`}
                  className="text-emerald-600 hover:underline"
                >
                  {tr("common.edit")}
                </Link>
                <DeleteForm
                  action={deleteAction}
                  id={p.id}
                  message={`${tr("common.delete")} "${p.name}"? ${tr("table.deleteMsg2")}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- Desktop: full table --- */}
      <div className="card hidden overflow-x-auto p-0 md:block">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b-2 border-gray-900 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">{tr("table.invoice")}</th>
              <th className="px-4 py-3">{tr("table.product")}</th>
              <th className="px-4 py-3">{tr("table.supplier")}</th>
              <th className="px-4 py-3 text-right">{tr("table.bought")}</th>
              <th className="px-4 py-3 text-right">{tr("table.paid")}</th>
              <th className="px-4 py-3 text-right">{tr("table.costPc")}</th>
              <th className="px-4 py-3 text-right">{tr("table.sellPc")}</th>
              <th className="px-4 py-3 text-right">{tr("table.stock")}</th>
              <th className="px-4 py-3">{tr("table.expiry")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  {tr("table.noMatch")} “{query}”.
                </td>
              </tr>
            )}
            {visible.map((p) => (
              <tr key={p.id} className="align-top hover:bg-gray-50/60">
                <td className="px-4 py-3">
                  {p.invoiceImageUrl ? (
                    <a href={p.invoiceImageUrl} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.invoiceImageUrl}
                        alt="invoice"
                        className="h-12 w-12 border-2 border-gray-900 object-cover"
                      />
                    </a>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center border-2 border-gray-200 bg-gray-50 text-gray-300">
                      <PixelIcon name="doc" size={24} />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">
                    {p.name}
                    {p.variant && (
                      <span className="ml-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-normal text-blue-700">
                        {p.variant}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {p.category} · {p.purchaseDateStr}
                    {p.barcode && <span className="ml-1 font-mono">· {p.barcode}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{p.supplier || "—"}</td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {p.packs}×{p.unitsPerPack}
                  <div className="text-xs text-gray-400">{p.bought} pcs</div>
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {p.paidStr}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {p.costStr}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                  {p.sellStr}
                  <div className="text-xs font-normal text-gray-400">
                    {p.marginPercent}%
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="font-semibold">{p.stock}</span>
                    {p.isOut ? (
                      <Badge tone="red">{tr("common.out")}</Badge>
                    ) : p.isLow ? (
                      <Badge tone="amber">{tr("common.low")}</Badge>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {p.expiryStr ? (
                    <Badge tone={p.expiryTone}>{p.expiryStr}</Badge>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                    <Link
                      href={`/products/new?copy=${p.id}`}
                      className="text-blue-600 hover:underline"
                      title="Create a new version of this product"
                    >
                      {tr("common.duplicate")}
                    </Link>
                    <Link
                      href={`/products/${p.id}/edit`}
                      className="text-emerald-600 hover:underline"
                    >
                      {tr("common.edit")}
                    </Link>
                    <DeleteForm
                      action={deleteAction}
                      id={p.id}
                      message={`${tr("common.delete")} "${p.name}"? ${tr("table.deleteMsg2")}`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
