import Link from "next/link";
import { ReactNode } from "react";
import { PixelIcon } from "@/components/PixelIcon";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mac-window mb-6">
      <div className="mac-titlebar">
        <Link href="/" aria-label="Go to dashboard" className="mac-close" />
        <h1 className="mac-title !text-base">{title}</h1>
      </div>
      {(subtitle || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          {subtitle ? (
            <p className="text-sm text-gray-600">{subtitle}</p>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "green" | "amber" | "red";
}) {
  const tones: Record<string, string> = {
    default: "text-gray-900",
    green: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600",
  };
  const bgs: Record<string, string> = {
    default: "card-lavender",
    green: "card-mint",
    amber: "card-banana",
    red: "card-peach",
  };
  return (
    <div className={`card ${bgs[tone]}`}>
      <div className="pixel text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className={`pixel mt-1 text-2xl font-bold ${tones[tone]}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

export function Badge({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "gray" | "green" | "amber" | "red" | "blue";
}) {
  const tones: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return <span className={`badge ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({
  title,
  hint,
  href,
  cta,
}: {
  title: string;
  hint?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="card flex flex-col items-center justify-center py-12 text-center">
      <PixelIcon name="box" size={40} className="text-gray-300" />
      <div className="pixel mt-3 font-semibold text-gray-800">{title}</div>
      {hint && <div className="mt-1 max-w-sm text-sm text-gray-500">{hint}</div>}
      {href && cta && (
        <Link href={href} className="btn btn-primary mt-4">
          {cta}
        </Link>
      )}
    </div>
  );
}

/** Simple horizontal bar for analytics (no chart library needed). */
export function Bar({
  value,
  max,
  tone = "green",
}: {
  value: number;
  max: number;
  tone?: "green" | "red" | "blue";
}) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  const tones: Record<string, string> = {
    green: "bg-emerald-500",
    red: "bg-red-400",
    blue: "bg-blue-500",
  };
  return (
    <div className="h-3 w-full overflow-hidden border-2 border-gray-900 bg-white">
      <div className={`h-full ${tones[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
