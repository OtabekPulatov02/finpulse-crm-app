import type { ReactNode } from "react";
import type React from "react";

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

export function Card({ className = "", children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
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

/* ---------- Modal с blur-фоном ---------- */
import { X } from "lucide-react";
import { useEffect, useState } from "react";

export function Modal({
  open, onClose, title, children, footer, wide,
}: {
  open: boolean; onClose: () => void; title: string;
  children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`flex max-h-[calc(100vh-3rem)] w-full flex-col rounded-xl bg-white shadow-2xl ${wide ? "max-w-2xl" : "max-w-lg"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Toast ---------- */
let pushToast: ((msg: string) => void) | null = null;
export function toast(msg: string) { pushToast?.(msg); }

export function Toaster() {
  const [items, setItems] = useState<{ id: number; msg: string }[]>([]);
  useEffect(() => {
    pushToast = (msg) => {
      const id = Date.now() + Math.random();
      setItems((s) => [...s, { id, msg }]);
      setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 3500);
    };
    return () => { pushToast = null; };
  }, []);
  return (
    <div className="fixed right-5 bottom-5 z-[100] flex max-w-sm flex-col gap-2">
      {items.map((i) => (
        <div key={i.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] font-medium shadow-lg">
          {i.msg}
        </div>
      ))}
    </div>
  );
}

/* ---------- Toggle ---------- */
export function Toggle({ defaultChecked = true }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors ${on ? "bg-brand-600" : "bg-slate-300"}`}
    >
      <span className={`absolute top-[3px] size-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-[19px]" : "translate-x-[3px]"}`} />
    </button>
  );
}

/* ---------- Dropdown menu ---------- */
import { useRef } from "react";

export function Menu({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} className="relative inline-block">
      <span onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>{trigger}</span>
      {open && (
        <div
          className="absolute right-0 z-40 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl"
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  children, onClick, danger, icon,
}: { children: ReactNode; onClick?: () => void; danger?: boolean; icon?: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-medium transition-colors ${
        danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

export function MenuDivider() {
  return <div className="my-1 border-t border-slate-100" />;
}

/* ---------- Form primitives ---------- */
export function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

const ctl = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13.5px] transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${ctl} ${props.className ?? ""}`} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${ctl} ${props.className ?? ""}`} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={`${ctl} resize-y ${props.className ?? ""}`} />;
}

/* ---------- Confirm modal ---------- */
export function ConfirmModal({
  open, onClose, onConfirm, title, text, confirmLabel = "Удалить", tone = "danger", icon,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; text: string; confirmLabel?: string; tone?: "danger" | "warning"; icon?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-5 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-full ${tone === "danger" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
          {icon}
        </div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{text}</p>
        <div className="mt-5 flex justify-center gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium hover:bg-slate-50">Отмена</button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`rounded-lg px-4 py-2 text-[13px] font-medium text-white ${tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
