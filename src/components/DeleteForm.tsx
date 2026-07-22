"use client";

import { useRef, useState } from "react";
import { MacAlert } from "@/components/MacDialog";
import { useLang } from "@/lib/useLang";
import { t } from "@/lib/i18n";

/**
 * A delete button that asks for confirmation with a classic
 * Mac alert dialog before submitting the server action.
 */
export default function DeleteForm({
  action,
  id,
  message,
}: {
  action: (formData: FormData) => void;
  id: number;
  message: string;
}) {
  const lang = useLang();
  const ref = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <form action={action} ref={ref}>
        <input type="hidden" name="id" value={id} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-red-500 hover:underline"
        >
          {t(lang, "common.delete")}
        </button>
      </form>
      {open && (
        <MacAlert
          message={message}
          confirmLabel={t(lang, "common.delete")}
          danger
          onCancel={() => setOpen(false)}
          onConfirm={() => {
            setOpen(false);
            ref.current?.requestSubmit();
          }}
        />
      )}
    </>
  );
}
