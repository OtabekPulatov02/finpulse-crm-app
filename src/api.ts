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
  dueDate?: string | null;
  source?: "bot" | "crm";
  doneAt?: string | null;
}

export interface CrmClient {
  id: string;
  company: string;
  position: string | null;
  phone: string | null;
  status: string;
  assignedTo: string | null;
  tariff: string | null;
  note: string | null;
  inn?: string | null;
  mfo?: string | null;
  bankAccount?: string | null;
  address?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  telegramId?: number | null;
}

export interface CalendarEntry {
  num: number;
  company: string;
  text: string;
  status: BotStatus;
  assignee: string | null;
  dueDate: string;
  overdue: boolean;
  dueToday: boolean;
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

async function post<T>(body: Record<string, unknown>): Promise<T> {
  const r = await fetch(API, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (r.status === 401) clearSession();
  return r.json() as Promise<T>;
}

/* ---------------- Клиенты ---------------- */

export const fetchClients = () =>
  get<{ ok: boolean; clients: CrmClient[] }>("r=clients").then((d) => d.clients ?? []);

export interface ClientResult { ok: boolean; id?: string; merged?: boolean; client?: CrmClient; error?: string }

export const createClientRequest = (data: {
  company: string; phone?: string; position?: string; tariff?: string; assignedTo?: string; note?: string;
}) => post<ClientResult>({ action: "client_create", ...data });

export const updateClientRequest = (id: string, patch: Partial<Pick<CrmClient,
  "status" | "assignedTo" | "tariff" | "note" | "position" | "inn" | "mfo" | "bankAccount" | "address"
>>) => post<ClientResult>({ action: "client_update", id, patch });

export const deleteClientRequest = (id: string) =>
  post<{ ok: boolean; id?: string; error?: string }>({ action: "client_delete", id });

/* ---------------- Задачи ---------------- */

export interface TaskResult { ok: boolean; task?: BotTask; error?: string }

export const createTaskRequest = (data: {
  clientId?: string; company?: string; text: string; assignee?: string; dueDate?: string | null;
}) => post<TaskResult>({ action: "task_create", ...data });

export const updateTaskRequest = (num: number, patch: Partial<Pick<BotTask, "text" | "assignee" | "company" | "dueDate">>) =>
  post<TaskResult>({ action: "task_update", num, patch });

export const deleteTaskRequest = (num: number) =>
  post<{ ok: boolean; num?: number; error?: string }>({ action: "task_delete", num });

/* Прикрепление файла к задаче из веб-CRM. Файл читается в base64 на
   клиенте (fileToBase64) и отправляется одним JSON-запросом — бэкенд
   пересылает байты в Telegram (группа бухгалтеров) и сохраняет
   полученный file_id в task.files. Лимит ~9 МБ (см. api/crm.js). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.slice(result.indexOf(",") + 1) : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export const attachTaskFileRequest = async (num: number, file: File) => {
  const dataBase64 = await fileToBase64(file);
  return post<TaskResult>({
    action: "task_attach_file", num, filename: file.name, mimeType: file.type, dataBase64,
  });
};

export const fetchCalendar = () =>
  get<{ ok: boolean; calendar: CalendarEntry[] }>("r=calendar").then((d) => d.calendar ?? []);

/* ---------------- Сотрудники ---------------- */

export interface CrmEmployee {
  id: string;
  name: string;
  phone: string | null;
  role: "admin" | "accountant";
  active: boolean;
  createdAt?: string | null;
}

export interface EmployeeResult { ok: boolean; employee?: CrmEmployee; password?: string; error?: string }

export const fetchEmployees = () =>
  get<{ ok: boolean; employees: CrmEmployee[] }>("r=employees").then((d) => d.employees ?? []);

export const createEmployeeRequest = (data: { name: string; phone: string; role: "admin" | "accountant" }) =>
  post<EmployeeResult>({ action: "employee_create", ...data });

export const updateEmployeeRequest = (id: string, patch: Partial<Pick<CrmEmployee, "name" | "role" | "active">>) =>
  post<EmployeeResult>({ action: "employee_update", id, patch });

export const resetEmployeePasswordRequest = (id: string) =>
  post<EmployeeResult>({ action: "employee_reset_password", id });

export const deleteEmployeeRequest = (id: string) =>
  post<{ ok: boolean; id?: string; error?: string }>({ action: "employee_delete", id });

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

export async function changePasswordRequest(currentPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch(AUTH_API, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ action: "change_password", currentPassword, newPassword }),
    signal: AbortSignal.timeout(10000),
  });
  return r.json();
}

/* ---------------- Календарь: повторяющиеся события (налоги/платежи) ---------------- */

export interface CalendarEventEntry {
  id: string;
  type: "tax" | "pay";
  title: string;
  company: string | null;
  date: string; // "YYYY-MM-DD" — дата следующего срабатывания
  repeat: "once" | "monthly" | "quarterly" | "yearly";
  remindDays: number;
  active: boolean;
  createdAt?: string | null;
}

export interface CalendarEventResult { ok: boolean; event?: CalendarEventEntry; error?: string }

export const fetchCalendarEvents = () =>
  get<{ ok: boolean; events: CalendarEventEntry[] }>("r=calendar_events").then((d) => d.events ?? []);

export const createCalendarEventRequest = (data: {
  type: "tax" | "pay"; title: string; company?: string | null; date: string;
  repeat?: CalendarEventEntry["repeat"]; remindDays?: number;
}) => post<CalendarEventResult>({ action: "calendar_event_create", ...data });

export const deleteCalendarEventRequest = (id: string) =>
  post<{ ok: boolean; error?: string }>({ action: "calendar_event_delete", id });

export function fmtTs(ts?: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(+d)) return ts;
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
