"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button that locks itself while the form (and its photo
 * upload) is in flight, showing an animated progress bar — no more
 * double-taps creating duplicates.
 */
export function SubmitWithProgress({
  label,
  pendingLabel,
  className,
}: {
  label: string;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <div className="space-y-2">
      {pending && (
        <div className="h-3.5 w-full overflow-hidden border-2 border-gray-900 bg-white">
          <div className="upload-slide h-full w-1/3 bg-gray-900" />
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className={`btn btn-primary ${pending ? "cursor-wait opacity-60" : ""} ${
          className ?? "w-full"
        }`}
      >
        {pending ? pendingLabel : label}
      </button>
    </div>
  );
}
