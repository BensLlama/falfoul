"use client";

import { useEffect } from "react";
import { PixelIcon, PixelIconName } from "@/components/PixelIcon";
import { useLang } from "@/lib/useLang";
import { t } from "@/lib/i18n";

/**
 * The classic Macintosh alert dialog — caution icon, message,
 * Cancel and a double-ringed default button.
 */
export function MacAlert({
  title = "Alert",
  message,
  icon = "caution",
  confirmLabel = "OK",
  danger,
  onConfirm,
  onCancel,
}: {
  title?: string;
  message: string;
  icon?: PixelIconName;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const lang = useLang();
  // Esc cancels, Enter confirms — like a real Mac.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onConfirm, onCancel]);

  return (
    <div
      className="mac fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/30 p-4"
      onClick={onCancel}
    >
      <div
        className="mac-window w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <div className="mac-titlebar">
          <span className="mac-close" style={{ visibility: "hidden" }} />
          <span className="mac-title">{title}</span>
        </div>
        <div className="flex items-start gap-4 p-5">
          <PixelIcon
            name={icon}
            size={44}
            className={`shrink-0 ${danger ? "text-red-600" : "text-gray-900"}`}
          />
          <p className="pt-1 text-sm leading-relaxed text-gray-800">
            {message}
          </p>
        </div>
        <div className="flex justify-end gap-5 px-5 pb-5">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {t(lang, "common.cancel")}
          </button>
          <button
            type="button"
            className={`btn btn-primary ${danger ? "!text-red-600" : ""}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
