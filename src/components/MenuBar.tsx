"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PixelIcon, PixelIconName } from "@/components/PixelIcon";
import { translator, type Lang, type TKey } from "@/lib/i18n";

const links: { href: string; key: TKey; icon: PixelIconName }[] = [
  { href: "/", key: "nav.dashboard", icon: "home" },
  { href: "/products", key: "nav.products", icon: "box" },
  { href: "/categories", key: "nav.categories", icon: "tag" },
  { href: "/suppliers", key: "nav.suppliers", icon: "truck" },
  { href: "/invoices", key: "nav.invoices", icon: "doc" },
  { href: "/sales", key: "nav.sales", icon: "coin" },
  { href: "/analytics", key: "nav.analytics", icon: "chart" },
  { href: "/alerts", key: "nav.alerts", icon: "bell" },
];

/** The classic Mac menu-bar clock. */
function Clock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    tick();
    const t = setInterval(tick, 15000);
    return () => clearInterval(t);
  }, []);
  return (
    <span suppressHydrationWarning className="pixel px-2 text-base text-gray-900">
      {time || "--:--"}
    </span>
  );
}

export default function MenuBar({ lang = "en" }: { lang?: Lang }) {
  const pathname = usePathname();
  const router = useRouter();
  const [about, setAbout] = useState(false);
  const tr = translator(lang);

  const toggleLang = () => {
    const next = lang === "fr" ? "en" : "fr";
    document.cookie = `lang=${next};path=/;max-age=31536000`;
    router.refresh();
  };

  return (
    <header className="no-print sticky top-0 z-50 border-b-2 border-gray-900 bg-white">
      <div className="flex h-12 items-center gap-0.5 overflow-x-auto px-2">
        {/* the "apple menu" — a six-color pepper, of course */}
        <button
          type="button"
          aria-label="About Falfoul"
          onClick={() => setAbout(true)}
          className="flex h-full shrink-0 items-center px-2.5 hover:bg-gray-900"
        >
          <PixelIcon name="pepper" size={24} rainbow />
        </button>

        {about && (
          <div
            className="mac fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/30 p-4"
            onClick={() => setAbout(false)}
          >
            <div
              className="mac-window w-full max-w-xs text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mac-titlebar">
                <button
                  aria-label="Close"
                  onClick={() => setAbout(false)}
                  className="mac-close"
                />
                <span className="mac-title">About Falfoul</span>
              </div>
              <div className="space-y-3 p-6">
                <PixelIcon
                  name="pepper"
                  size={48}
                  rainbow
                  className="mx-auto"
                />
                <div className="pixel text-lg font-semibold">Falfoul</div>
                <div className="pixel text-xs text-gray-500">
                  System 1.0 · My convenient store
                </div>
                <div className="border-t-2 border-dashed border-gray-300 pt-3 text-xs text-gray-500">
                  Total Memory: enough
                  <br />
                  Largest Unused Block: your shelf space
                  <br />
                  <span className="pixel">Made with ♥ and 1-bit pixels</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {links.map((l) => {
          const active =
            l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          const label = tr(l.key);
          return (
            <Link
              key={l.href}
              href={l.href}
              title={label}
              className={`pixel flex h-full shrink-0 items-center gap-1.5 whitespace-nowrap px-4 text-base sm:px-3.5 ${
                active
                  ? "bg-gray-900 text-white"
                  : "text-gray-900 hover:bg-gray-900 hover:text-white"
              }`}
            >
              <PixelIcon name={l.icon} size={20} />
              <span className="hidden md:inline">{label}</span>
            </Link>
          );
        })}

        <div className="ml-auto flex shrink-0 items-center">
          <button
            type="button"
            onClick={toggleLang}
            title={lang === "fr" ? "Switch to English" : "Passer en français"}
            className="pixel px-3 text-base text-gray-900 hover:bg-gray-900 hover:text-white"
          >
            {lang === "fr" ? "EN" : "FR"}
          </button>
          <span className="pixel hidden px-2 text-sm text-gray-400 sm:inline">
            Falfoul
          </span>
          <Clock />
        </div>
      </div>
    </header>
  );
}
