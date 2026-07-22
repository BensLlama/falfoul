"use client";

import { useEffect, useRef, useState } from "react";
import { PixelIcon } from "@/components/PixelIcon";

/**
 * A "Scan" button that opens the phone camera in a Mac window and
 * reads any common barcode (EAN, UPC, Code 128/39, Codabar, QR…).
 * Falls back gracefully if the camera is unavailable — you can
 * always type the code by hand.
 */
export default function BarcodeScanner({
  onScan,
  label = "Scan",
}: {
  onScan: (code: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-ghost shrink-0 !px-3"
        title="Scan barcode with camera"
      >
        <PixelIcon name="barcode" size={14} /> {label}
      </button>
      {open && (
        <ScannerModal
          onClose={() => setOpen(false)}
          onScan={(code) => {
            setOpen(false);
            onScan(code);
          }}
        />
      )}
    </>
  );
}

function ScannerModal({
  onClose,
  onScan,
}: {
  onClose: () => void;
  onScan: (code: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const scannedRef = useRef(false);

  useEffect(() => {
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const s = new Html5Qrcode("falfoul-scanner");
        scanner = s;
        await s.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 140 } },
          (text) => {
            if (scannedRef.current) return;
            scannedRef.current = true;
            s.stop().catch(() => {});
            onScan(text.trim());
          },
          () => {} // per-frame decode misses — ignore
        );
      } catch (e) {
        setError(
          "Camera unavailable — allow camera access, or type the code by hand. " +
            String(e instanceof Error ? e.message : e)
        );
      }
    })();

    return () => {
      cancelled = true;
      scanner?.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div
      className="mac fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="mac-window w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mac-titlebar">
          <button aria-label="Close" onClick={onClose} className="mac-close" />
          <span className="mac-title">Scan barcode</span>
        </div>
        <div className="p-4">
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <>
              <div id="falfoul-scanner" className="overflow-hidden border-2 border-gray-900" />
              <p className="pixel mt-2 text-center text-xs text-gray-500">
                Point the camera at the barcode…
              </p>
            </>
          )}
          <div className="mt-3 flex justify-end">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
