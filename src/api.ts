/* Клиент API-моста: тот же бэкенд, что у Telegram-бота (finpulse-crm.vercel.app) */
import { getToken, clearSession } from "./auth";

const ORIGIN = "https://finpulse-crm.vercel.app";
const API = `${ORIGIN}/api/crm`;
const AUTH_API = `${ORIGIN}/api/auth`;
/* Временный общий ключ (до полноценных JWT-сессий из ролевой системы).
   ВАЖНО: это НЕ секрет в полном смысле — код фронта публичный, ключ виден
   в собранном JS-бандле любому желающему. Он лишь закрывает API от
   случайного/автоматического сканирования, а не от целенаправленного разбора. */
const API_KEY = import.meta.env.VITE_CRM_API_KEY || "";

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  if (API_KEY) h["x-api-key"] = API_KEY;
  const token = getToken();
  if (token) h["authorization"] = `Bearer ${token}`;
  return h;
}

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
  const r = await fetch(`${API}?${params}`, {
    signal: AbortSignal.timeout(8000),
    headers: authHeaders(),
  });
  if (r.status === 401) clearSession();
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
    headers: {
      "content-type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ action: "status", num, status, assignee }),
    signal: AbortSignal.timeout(10000),
  });
  if (r.status === 401) clearSession();
  return r.json() as Promise<{ ok: boolean; error?: string }>;
}

/* ---------------- Авторизация ---------------- */
export interface LoginResult { ok: boolean; token?: string; role?: string; name?: string; company?: string; error?: string }

export async function loginRequest(identity: string, password: string): Promise<LoginResult> {
  const r = await fetch(AUTH_API, {
    method: "POST",
    headers: { "content-type": "application/json", ...(API_KEY ? { "x-api-key": API_KEY } : {}) },
    body: JSON.stringify({ action: "login", identity, password }),
    signal: AbortSignal.timeout(10000),
  });
  return r.json();
}

export async function guestLoginRequest(): Promise<LoginResult> {
  const r = await fetch(AUTH_API, {
    method: "POST",
    headers: { "content-type": "application/json", ...(API_KEY ? { "x-api-key": API_KEY } : {}) },
    body: JSON.stringify({ action: "guest" }),
    signal: AbortSignal.timeout(10000),
  });
  return r.json();
}

export function fmtTs(ts?: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(+d)) return ts;
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
