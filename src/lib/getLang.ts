import { cookies } from "next/headers";
import type { Lang } from "./i18n";

/** Server-side: read the language cookie set by the menu-bar toggle. */
export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get("lang")?.value;
  return c === "fr" ? "fr" : "en";
}
