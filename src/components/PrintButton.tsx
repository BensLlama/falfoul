"use client";

import { PixelIcon } from "@/components/PixelIcon";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn btn-primary no-print">
      <PixelIcon name="printer" /> Print / Save as PDF
    </button>
  );
}
