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

export type BotStatus = "new" | "in_progress" | "done" | "cancelled";

export interface TaskAttachment {
  index: number;
  kind: "photo" | "document" | "video" | "voice" | "audio";
}

export interface ThreadMessage {
  id: string;
  at: string;
  from: "staff" | "client";
  by: string;
  text: string | null;
  fileIndex: number | null;
}

export interface BotTask {
  num: number;
  company: string | null;
  text: string;
  status: BotStatus;
  assignee: string | null;
  createdAt: string | null;
  files: number;
  attachments?: TaskAttachment[];
  dueDate?: string | null;
  source?: "bot" | "crm";
  doneAt?: string | null;
  type?: "task" | "reminder";
  thread?: ThreadMessage[];
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
  fullName?: string | null;
  pinfl?: string | null;
  vatCode?: string | null;
  taxSystem?: string | null;
  bank?: string | null;
  director?: string | null;
  taxOffice?: string | null;
  source1c?: { app: string; ref: string; name: string } | null;
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

export interface AccessRequest {
  id: string;
  type: "phone_mismatch" | "phone_conflict" | "telegram_rebind";
  status: "pending" | "approved" | "rejected";
  at: string;
  company?: string;
  claimedPhone?: string | null;
  knownPhone?: string | null;
  otherCompany?: string | null;
  tgName?: string | null;
  telegramId?: number | string;
  resolvedBy?: string;
}

export const fetchAccessRequests = () =>
  get<{ ok: boolean; requests: AccessRequest[] }>("r=access_requests").then((d) => d.requests ?? []);

export const resolveAccessRequest = (id: string, approve: boolean) =>
  post<{ ok: boolean; error?: string }>({ action: "access_request_resolve", id, approve });

/* ---------------- Клиенты ---------------- */

export const fetchClients = () =>
  get<{ ok: boolean; clients: CrmClient[] }>("r=clients").then((d) => d.clients ?? []);

export interface ClientResult { ok: boolean; id?: string; merged?: boolean; client?: CrmClient; error?: string }

export const createClientRequest = (data: {
  company: string; phone?: string; position?: string; tariff?: string; assignedTo?: string; note?: string;
}) => post<ClientResult>({ action: "client_create", ...data });

export const updateClientRequest = (id: string, patch: Partial<Pick<CrmClient,
  "status" | "assignedTo" | "tariff" | "note" | "position" | "inn" | "mfo" | "bankAccount" | "address" | "fullName" | "pinfl" | "vatCode" | "taxSystem" | "bank" | "director" | "taxOffice" | "phone"
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

/* Отправка сообщения в ленту задачи — чисто внутренняя история (как в
   YouTrack), никуда за пределы CRM не уходит. Можно приложить файл —
   он загружается вместе с сообщением одним запросом. */
export const sendTaskMessageRequest = async (num: number, text: string, file?: File | null) => {
  const fileFields = file
    ? { filename: file.name, mimeType: file.type, dataBase64: await fileToBase64(file) }
    : {};
  return post<TaskResult>({ action: "task_message_send", num, text, ...fileFields });
};

/* Открывает вложение задачи в новой вкладке: заголовки авторизации нельзя
   передать через обычную ссылку/img, поэтому скачиваем как Blob через
   fetch с authHeaders(), затем открываем через object URL. */
export async function openTaskFile(num: number, index: number): Promise<void> {
  const blob = await fetchTaskFileBlob(num, index);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/* Загружает вложение как Blob (без открытия вкладки) — используется
   предпросмотром внутри CRM (FilePreviewer), который сам решает, как
   показать файл (картинка/pdf/видео/скачивание). */
export async function fetchTaskFileBlob(num: number, index: number): Promise<Blob> {
  const r = await fetch(`${API}?r=task_file&num=${num}&i=${index}`, {
    headers: authHeaders(),
    signal: AbortSignal.timeout(20000),
  });
  if (r.status === 401) { clearSession(); throw new Error("unauthorized"); }
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.blob();
}

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

export const updateCalendarEventRequest = (id: string, patch: Partial<{
  title: string; company: string | null; date: string;
  repeat: CalendarEventEntry["repeat"]; remindDays: number; active: boolean;
}>) => post<CalendarEventResult>({ action: "calendar_event_update", id, patch });

export function fmtTs(ts?: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(+d)) return ts;
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/* ---------------- Тарифы и лимиты операций ---------------- */
export interface Tariff {
  id: string;
  name: string;
  price: number | null;
  monthlyLimit: number | null;
  overPackOps: number | null;
  overPackPrice: number | null;
}
export interface ClientUsage {
  used: number;
  limit: number | null;
  baseLimit: number | null;
  extraPacks: number;
  tariffName: string | null;
  over: boolean;
}

export const fetchTariffs = () =>
  get<{ ok: boolean; tariffs: Tariff[] }>("r=tariffs").then((d) => d.tariffs ?? []);

export const saveTariffs = (tariffs: Tariff[]) =>
  post<{ ok: boolean; tariffs?: Tariff[]; error?: string }>({ action: "tariffs_save", tariffs });

export const fetchUsage = () =>
  get<{ ok: boolean; usage: Record<string, ClientUsage> }>("r=usage").then((d) => d.usage ?? {});

export const addOpsPack = (clientId: string, packs = 1) =>
  post<{ ok: boolean; packs?: number; error?: string }>({ action: "ops_pack_add", clientId, packs });

/* ---------------- 1С (Clobus) ---------------- */
const API_1C = `${ORIGIN}/api/1c`;

export interface App1C {
  code: string; path: string; name: string;
  reachable?: boolean; status?: number; entities?: number | null; ready?: boolean; error?: string;
}

async function get1c<T>(params: string): Promise<T> {
  const r = await fetch(`${API_1C}?${params}`, { signal: AbortSignal.timeout(25000), headers: authHeaders() });
  if (!r.ok && r.status !== 401) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export const fetch1cPing = () =>
  get1c<{ ok: boolean; apps?: App1C[]; error?: string }>("r=ping");

export const sync1cOrgs = async (app: string) => {
  const r = await fetch(API_1C, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ action: "sync_orgs", app }),
    signal: AbortSignal.timeout(30000),
  });
  return r.json() as Promise<{ ok: boolean; created?: number; updated?: number; total?: number; error?: string }>;
};

export const sync1cCounterparties = async (app: string) => {
  const r = await fetch(API_1C, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ action: "sync_counterparties", app }),
    signal: AbortSignal.timeout(30000),
  });
  return r.json() as Promise<{ ok: boolean; total?: number; mapped?: number; error?: string }>;
};

export const sync1cNomenclature = async (app: string) => {
  const r = await fetch(API_1C, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ action: "sync_nomenclature", app }),
    signal: AbortSignal.timeout(30000),
  });
  return r.json() as Promise<{ ok: boolean; total?: number; mapped?: number; error?: string }>;
};

export const sync1cContracts = async (app: string) => {
  const r = await fetch(API_1C, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ action: "sync_contracts", app }),
    signal: AbortSignal.timeout(30000),
  });
  return r.json() as Promise<{ ok: boolean; total?: number; owners?: number; defaults?: number; error?: string }>;
};

export interface Doc1cLogItem {
  num: number; entity: string; ref: string; number: string | null; app: string; appName: string | null;
  company: string; type: string; amount: number | null; counterparty: string | null; at: string; by: string;
}

export const fetch1cDoclog = (limit = 50) =>
  get1c<{ ok: boolean; items?: Doc1cLogItem[]; error?: string }>(`r=doclog&limit=${limit}`);

export interface Report1cItem {
  name: string; periodicity: string; lastPeriodLabel: string; lastPeriodEnd: string;
  lastPreparedAt: string; nextExpectedPeriodEnd: string; periodsSkipped: number;
  appCode: string; appName: string;
}

export const fetch1cReports = () =>
  get1c<{ ok: boolean; items?: Report1cItem[]; note?: string; error?: string }>("r=reports");

export const sync1cEmployees = async (app: string) => {
  const r = await fetch(API_1C, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ action: "sync_employees", app }),
    signal: AbortSignal.timeout(30000),
  });
  return r.json() as Promise<{ ok: boolean; total?: number; mapped?: number; error?: string }>;
};

export const sync1cPositions = async (app: string) => {
  const r = await fetch(API_1C, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ action: "sync_positions", app }),
    signal: AbortSignal.timeout(30000),
  });
  return r.json() as Promise<{ ok: boolean; total?: number; mapped?: number; error?: string }>;
};

export const sync1cReports = async (app: string) => {
  const r = await fetch(API_1C, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ action: "sync_reports", app }),
    signal: AbortSignal.timeout(30000),
  });
  return r.json() as Promise<{ ok: boolean; total?: number; types?: number; error?: string }>;
};

/* ---------------- Настройки бота и категории услуг ---------------- */
export interface BotSettings { slaHours: number; workStart: number; workEnd: number; tzOffset: number }
export interface BotCategory { id: string; name: string; subs: string[] }

export const fetchBotSettings = () =>
  get<{ ok: boolean; settings: BotSettings }>("r=bot_settings").then((d) => d.settings);

export const saveBotSettings = (settings: BotSettings) =>
  post<{ ok: boolean; error?: string }>({ action: "bot_settings_save", settings });

export const fetchBotCategories = () =>
  get<{ ok: boolean; categories: BotCategory[] | null }>("r=bot_categories").then((d) => d.categories);

export const saveBotCategories = (categories: BotCategory[]) =>
  post<{ ok: boolean; error?: string }>({ action: "bot_categories_save", categories });

/* ---------------- AI ---------------- */
const API_AI = `${ORIGIN}/api/ai`;

export interface AiSettings { classify: boolean; drafts: boolean; summarize: boolean; autoWork: boolean }

async function aiGet<T>(params: string): Promise<T> {
  const r = await fetch(`${API_AI}?${params}`, { signal: AbortSignal.timeout(20000), headers: authHeaders() });
  return r.json();
}
async function aiPost<T>(body: Record<string, unknown>): Promise<T> {
  /* agent-запросы (многошаговый ИИ-агент) могут занимать до ~60с на сервере (см. vercel.json maxDuration) —
     таймаут клиента должен быть больше, иначе валидные ответы обрываются раньше времени. */
  const timeoutMs = body?.action === "agent" ? 65000 : 30000;
  const r = await fetch(API_AI, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  return r.json();
}

export const fetchAiPing = (test = false) =>
  aiGet<{ ok: boolean; key: boolean; model: string; live?: boolean; error?: string }>(`r=ping${test ? "&test=1" : ""}`);

export const fetchAiSettings = () =>
  aiGet<{ ok: boolean; settings: AiSettings; key: boolean }>("r=settings");

export const saveAiSettings = (settings: AiSettings) =>
  aiPost<{ ok: boolean; error?: string }>({ action: "settings_save", settings });

export const aiClassify = (text: string) =>
  aiPost<{ ok: boolean; result: { category: string; sub: string | null } | null; error?: string }>({ action: "classify", text });

export const aiDraft = (num: number) =>
  aiPost<{ ok: boolean; draft?: Record<string, unknown>; error?: string }>({ action: "draft", num });

export const fetchBotPositions = () =>
  get<{ ok: boolean; positions: string[] }>("r=bot_positions").then((d) => d.positions ?? []);

export const saveBotPositions = (positions: string[]) =>
  post<{ ok: boolean; error?: string }>({ action: "bot_positions_save", positions });

export interface AgentMessage { role: "user" | "assistant"; content: string }
export interface AgentStep { tool: string; args: string; ok: boolean }

export const aiAgent = (messages: AgentMessage[], chatId?: string | null) =>
  aiPost<{ ok: boolean; reply: string; steps?: AgentStep[]; chatId?: string; error?: string; askOptions?: string[]; awaitingConfirmation?: boolean }>({ action: "agent", messages, chatId });

export interface AiChatMeta { id: string; title: string; updatedAt: string; count: number }
export interface StoredChatMsg { role: "user" | "assistant"; content: string; steps?: AgentStep[] }

export const fetchAiChats = () =>
  aiGet<{ ok: boolean; chats: AiChatMeta[] }>("r=chats").then((d) => d.chats ?? []);

export const fetchAiChat = (id: string) =>
  aiGet<{ ok: boolean; messages: StoredChatMsg[] }>(`r=chat&id=${encodeURIComponent(id)}`).then((d) => d.messages ?? []);

export const deleteAiChat = (id: string) =>
  aiPost<{ ok: boolean }>({ action: "chat_delete", id });

export const clearAllAiChats = () =>
  aiPost<{ ok: boolean; cleared: number }>({ action: "chat_clear_all" });
