/* Клиент API-моста: тот же бэкенд, что у Telegram-бота (finpulse-crm.vercel.app) */

const API = "https://finpulse-crm.vercel.app/api/crm";

export type BotStatus = "new" | "in_progress" | "done";

export interface BotTask {
  num: number;
  company: string;
  text: string;
  status: BotStatus;
  assignee: string | null;
  createdAt: string | null;
  files: number;
}

export interface LogRow {
  ts: string;
  event: string;
  num?: number;
  company?: string;
  from?: string;
  by?: string;
  assignee?: string | null;
  text?: string;
  [k: string]: unknown;
}

export interface PendingClient { company: string; phone: string | null; at: string | null }

async function get<T>(params: string): Promise<T> {
  const r = await fetch(`${API}?${params}`, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export const fetchPing = () =>
  get<{ ok: boolean; tasks: number; group: boolean; bot: string }>("r=ping");

export const fetchBotTasks = () =>
  get<{ ok: boolean; tasks: BotTask[] }>("r=tasks").then((d) => d.tasks ?? []);

export const fetchLogs = (src: "telegram" | "crm") =>
  get<{ ok: boolean; logs: LogRow[] }>(`r=logs&src=${src}`).then((d) => d.logs ?? []);

export const fetchPending = () =>
  get<{ ok: boolean; pending: PendingClient[] }>("r=pending").then((d) => d.pending ?? []);

export async function pushBotStatus(num: number, status: BotStatus, assignee?: string) {
  const r = await fetch(API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "status", num, status, assignee }),
    signal: AbortSignal.timeout(10000),
  });
  return r.json() as Promise<{ ok: boolean; error?: string }>;
}

export function fmtTs(ts?: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(+d)) return ts;
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
