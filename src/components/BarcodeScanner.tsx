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

  // Keep callbacks in refs so the camera effect never re-runs.
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    let disposed = false;
    let scanned = false;
    // The lifecycle promise chain: every stop waits for start to settle,
    // which survives React Strict Mode's mount → unmount → mount in dev.
    let session: Promise<{ stop: () => Promise<void> } | null> = Promise.resolve(null);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError(
        "No camera available in this browser. You can type the code by hand."
      );
      return;
    }

    session = (async () => {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
        "html5-qrcode"
      );
      if (disposed) return null;
      const el = document.getElementById("falfoul-scanner");
      if (!el) return null;
      const scanner = new Html5Qrcode("falfoul-scanner", {
        verbose: false,
        // Every retail barcode format, not just QR codes.
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        // Use the phone's native barcode engine when available —
        // dramatically better at 1D barcodes than the JS fallback.
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      });
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            // Wide box shaped like a product barcode.
            qrbox: (w, h) => ({
              width: Math.min(340, Math.floor(w * 0.9)),
              height: Math.min(140, Math.floor(h * 0.5)),
            }),
            // Sharper feed = readable bars.
            videoConstraints: {
              facingMode: "environment",
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          },
          (text) => {
            if (scanned || disposed) return;
            scanned = true;
            onScanRef.current(text.trim());
          },
          () => {} // per-frame decode misses — ignore
        );
      } catch (e) {
        if (!disposed) {
          setError(
            "Camera unavailable — allow camera access in your browser, or type the code by hand."
          );
          console.warn("barcode scanner:", e);
        }
        return null;
      }
      if (disposed) {
        // Unmounted while the camera was warming up — shut it down.
        await scanner.stop().catch(() => {});
        return null;
      }
      return scanner;
    })();

    return () => {
      disposed = true;
      session
        .then((scanner) => scanner?.stop())
        .catch(() => {})
        .then(() => {
          // html5-qrcode leaves its UI in the container — clear it.
          const el = document.getElementById("falfoul-scanner");
          if (el) el.innerHTML = "";
        });
    };
  }, []);

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
          <div
            id="falfoul-scanner"
            className={`overflow-hidden border-2 border-gray-900 ${
              error ? "hidden" : ""
            }`}
          />
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <p className="pixel mt-2 text-center text-xs text-gray-500">
              Hold the barcode inside the box, 10–15 cm away, in good light…
            </p>
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
