import type { ReactNode } from "react";

const tones = {
  blue: "bg-brand-50 text-brand-600 border-brand-200",
  green: "bg-emerald-50 text-emerald-600 border-emerald-200",
  yellow: "bg-amber-50 text-amber-600 border-amber-200",
  red: "bg-red-50 text-red-600 border-red-200",
  gray: "bg-slate-100 text-slate-600 border-slate-200",
  purple: "bg-violet-50 text-violet-600 border-violet-200",
  cyan: "bg-cyan-50 text-cyan-600 border-cyan-200",
} as const;

export type Tone = keyof typeof tones;

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${tones[tone]}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {action}
    </div>
  );
}

export function Avatar({ name, className = "" }: { name: string; className?: string }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  const palette = ["bg-brand-600", "bg-violet-600", "bg-cyan-600", "bg-amber-600", "bg-rose-600", "bg-emerald-600"];
  const color = palette[name.length % palette.length];
  return (
    <span className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white select-none ${color} ${className}`}>
      {initials}
    </span>
  );
}
