"use client";

import { useEffect, useState } from "react";
import type { Lang } from "./i18n";

/** Client-side: read the language cookie (set by the menu-bar toggle). */
export function useLang(): Lang {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)lang=(fr|en)/);
    if (m) setLang(m[1] as Lang);
  }, []);
  return lang;
}
