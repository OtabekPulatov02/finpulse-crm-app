import { useSyncExternalStore } from "react";
import {
  createTaskRequest, deleteTaskRequest, fetchBotTasks, pushBotStatus, sendTaskMessageRequest, updateTaskRequest,
  fmtTs, type BotStatus, type BotTask,
} from "../api";
import type { Task, TaskStatus } from "../data/demo";
import { getSession } from "../auth";

let tasks: Task[] = [];
const listeners = new Set<() => void>();

/* Кэш последнего снимка задач в localStorage — привязан к токену сессии,
   чтобы не показать данные одного аккаунта другому на этом же устройстве.
   Назначение: сразу после перезагрузки страницы отрисовать карточки из
   кэша (пока идёт свежий запрос к бэкенду), а не показывать пустой экран
   до завершения сетевого запроса. */
function cacheKey(): string | null {
  const token = getSession()?.token;
  return token ? `fp_tasks_cache:${token}` : null;
}
function loadTasksCache(): Task[] {
  try {
    const key = cacheKey();
    if (!key) return [];
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function saveTasksCache(list: Task[]) {
  try {
    const key = cacheKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* localStorage переполнен/недоступен — кэш просто необязателен, не критично */
  }
}

/* id реальных задач (из Telegram-бота ИЛИ созданных из CRM через реальный
   API) — все задачи в CRM теперь живые, синхронизируются с бэкендом. */
const liveIds = new Set<number>();
let hydrated = false;

function emit() {
  tasks = [...tasks];
  listeners.forEach((l) => l());
}

export function useTasks(): Task[] {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => tasks,
  );
}

export const isLiveTask = (id: number) => liveIds.has(id);

/* Сброс стора при смене сессии (логин/логаут/смена роли в той же вкладке) —
   иначе данные, полученные под одной ролью (например, реальные задачи
   супер-админа), остаются видны после переключения на гостя/клиента. */
export function resetTasksStore() {
  const key = cacheKey();
  hydrated = false;
  liveIds.clear();
  tasks = [];
  emit();
  if (key) { try { localStorage.removeItem(key); } catch { /* noop */ } }
}

const fromBotStatus: Record<BotStatus, TaskStatus> = {
  new: "Новая", in_progress: "В работе", done: "Выполнена", cancelled: "Отменено",
};
const toBotStatus: Partial<Record<TaskStatus, BotStatus>> = {
  "Новая": "new", "В работе": "in_progress", "Выполнена": "done", "Отменено": "cancelled",
};

/* "YYYY-MM-DD" → "ДД.ММ" — формат отображения, который уже использует
   остальной интерфейс (канбан/таблица/isOverdue) */
export function isoToDisplayDue(iso?: string | null): string {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "—";
  return `${m[3]}.${m[2]}`;
}

function botTaskToTask(b: BotTask): Task {
  return {
    id: b.num,
    title: b.text.length > 80 ? b.text.slice(0, 77) + "…" : b.text,
    description: b.text.length > 80 ? b.text : undefined,
    client: b.company ?? (b.type === "reminder" ? "Все клиенты" : "—"),
    assignee: b.assignee ?? "не назначен",
    status: fromBotStatus[b.status] ?? "Новая",
    priority: "Средний",
    due: isoToDisplayDue(b.dueDate),
    dueDate: b.dueDate ?? null,
    doneAt: b.doneAt ?? null,
    fromBot: true,
    source: b.source === "crm" ? "crm" as const : "bot" as const,
    created: fmtTs(b.createdAt),
    attachments: b.attachments ?? [],
    type: b.type ?? "task",
    thread: b.thread ?? [],
  };
}

/* Подтягиваем реальные задачи с бэкенда (однократно при загрузке приложения).
   Пока идёт сетевой запрос, если стор ещё пуст (свежая перезагрузка
   страницы), сразу показываем последний кэшированный снимок — иначе
   канбан несколько сотен миллисекунд выглядит пустым, хотя данные почти
   наверняка не изменились с прошлого раза. */
export async function hydrateFromBot() {
  if (hydrated) return;
  hydrated = true;

  if (!tasks.length) {
    const cached = loadTasksCache();
    if (cached.length) {
      cached.forEach((t) => liveIds.add(t.id));
      tasks = cached;
      emit();
    }
  }

  try {
    const bot = await fetchBotTasks();
    const live = bot.map(botTaskToTask);
    live.forEach((t) => liveIds.add(t.id));
    tasks = [...live, ...tasks.filter((t) => !liveIds.has(t.id))];
    emit();
    saveTasksCache(tasks);
  } catch {
    hydrated = false; /* бэкенд недоступен — попробуем ещё раз при следующем обращении */
  }
}

/* "Живое" обновление без перезагрузки страницы: периодический опрос
   бэкенда (простой, надёжный вариант без веб-сокетов — Vercel serverless
   функции не держат постоянное соединение, поэтому polling — самый
   практичный способ получить почти-реальное время без отдельного
   realtime-сервиса). Плюс мгновенный повторный опрос при возврате на
   вкладку, чтобы не ждать до конца интервала после долгого отсутствия. */
let liveSyncStarted = false;
export function startLiveTasksSync(intervalMs = 7000) {
  if (liveSyncStarted) return;
  liveSyncStarted = true;

  const tick = async () => {
    if (!getSession()) return;
    try {
      const bot = await fetchBotTasks();
      const live = bot.map(botTaskToTask);
      live.forEach((t) => liveIds.add(t.id));
      tasks = [...live, ...tasks.filter((t) => !liveIds.has(t.id))];
      emit();
      saveTasksCache(tasks);
    } catch {
      /* сеть моргнула — попробуем на следующем тике, не критично */
    }
  };

  setInterval(() => { void tick(); }, intervalMs);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void tick();
  });
  window.addEventListener("focus", () => void tick());
}

export function setTaskStatus(id: number, status: TaskStatus) {
  const t = tasks.find((t) => t.id === id);
  if (!t || t.status === status) return;
  const prevStatus = t.status;
  t.status = status;
  if (status === "Выполнена") t.doneAt = new Date().toISOString();
  else if (prevStatus === "Выполнена") t.doneAt = null; // вернули в работу — снимаем метку для авто-архива
  emit();
  /* живая задача → шлём статус на бэкенд (клиент получит уведомление в Telegram) */
  const bs = toBotStatus[status];
  if (liveIds.has(id) && bs) {
    const actor = getSession()?.name || "CRM";
    void pushBotStatus(id, bs, actor).catch(() => {});
  }
}

/* Через 24ч после выполнения задача "уходит в архив" — это не отдельный
   статус на бэкенде (там только new/in_progress/done), а чисто
   отображаемый бакет, вычисляемый по doneAt. Ручного статуса "Архив"
   не существует — см. EDITABLE_STATUSES в data/demo.ts. */
const ARCHIVE_AFTER_MS = 24 * 60 * 60 * 1000;
export function displayStatus(t: Task): TaskStatus {
  if (t.status === "Выполнена" && t.doneAt) {
    const doneTime = new Date(t.doneAt).getTime();
    if (!Number.isNaN(doneTime) && Date.now() - doneTime > ARCHIVE_AFTER_MS) return "Архив";
  }
  return t.status;
}

/* Просрочена ли задача по дате "due" (формат ДД.ММ). Выполненные и
   заархивированные задачи никогда не считаются просроченными. */
export function isOverdue(t: Task): boolean {
  if (t.status === "Выполнена" || t.status === "Отменено") return false;
  const m = t.due.match(/^(\d{2})\.(\d{2})/);
  if (!m) return false;
  const now = new Date();
  return new Date(now.getFullYear(), +m[2] - 1, +m[1]) < new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/* Создание задачи — всегда уходит в реальный бэкенд (карточка в группу
   бухгалтеров + уведомление клиенту в Telegram, если передан clientId). */
export async function createTask(data: {
  title: string; client: string; clientId?: string | null; assignee: string;
  priority: Task["priority"]; dueDate?: string | null; description?: string;
}): Promise<{ ok: boolean; error?: string; id?: number }> {
  const actor = getSession()?.name || "CRM";
  const r = await createTaskRequest({
    clientId: data.clientId ?? undefined,
    company: data.clientId ? undefined : data.client,
    text: data.description?.trim() || data.title,
    assignee: data.assignee === "auto" ? undefined : data.assignee,
    dueDate: data.dueDate ?? undefined,
  });
  if (!r.ok || !r.task) return { ok: false, error: r.error };
  const b = r.task;
  const t: Task = {
    id: b.num,
    title: data.title,
    description: data.description || undefined,
    client: b.company ?? "—",
    clientId: data.clientId ?? null,
    assignee: b.assignee ?? (data.assignee === "auto" ? "не назначен" : data.assignee),
    status: fromBotStatus[b.status] ?? "Новая",
    priority: data.priority,
    due: isoToDisplayDue(b.dueDate),
    dueDate: b.dueDate ?? null,
    doneAt: null,
    fromBot: true,
    source: "crm" as const,
    created: "сегодня",
    type: b.type ?? "task",
    thread: [],
  };
  liveIds.add(t.id);
  tasks = [t, ...tasks];
  emit();
  void actor;
  return { ok: true, id: t.id };
}

export async function editTask(id: number, patch: {
  title?: string; client?: string; assignee?: string; priority?: Task["priority"];
  dueDate?: string | null; description?: string; status?: TaskStatus;
}): Promise<{ ok: boolean; error?: string }> {
  const t = tasks.find((t) => t.id === id);
  if (!t) return { ok: false, error: "not found" };

  if (liveIds.has(id)) {
    const r = await updateTaskRequest(id, {
      text: patch.description?.trim() || patch.title,
      assignee: patch.assignee,
      company: patch.client,
      dueDate: patch.dueDate,
    });
    if (!r.ok) return { ok: false, error: r.error };
  }

  Object.assign(t, {
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.client !== undefined ? { client: patch.client } : {}),
    ...(patch.assignee !== undefined ? { assignee: patch.assignee } : {}),
    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.dueDate !== undefined ? { dueDate: patch.dueDate, due: isoToDisplayDue(patch.dueDate) } : {}),
  });
  if (patch.status !== undefined) setTaskStatus(id, patch.status);
  emit();
  return { ok: true };
}

export function removeTask(id: number) {
  tasks = tasks.filter((t) => t.id !== id);
  liveIds.delete(id);
  emit();
}

export async function deleteTaskEverywhere(id: number): Promise<{ ok: boolean; error?: string }> {
  if (liveIds.has(id)) {
    const r = await deleteTaskRequest(id);
    if (!r.ok) return { ok: false, error: r.error };
  }
  removeTask(id);
  return { ok: true };
}

/* Отправка сообщения в чат задачи — уходит в Telegram (клиенту в личку
   или в группу бухгалтеров, в зависимости от роли отправителя) и
   возвращает актуальную ленту с бэкенда, которой обновляем локальный стор. */
export async function sendMessage(id: number, text: string, file?: File | null): Promise<{ ok: boolean; error?: string }> {
  const clean = text.trim();
  if (!clean && !file) return { ok: false, error: "text required" };
  const r = await sendTaskMessageRequest(id, clean, file);
  if (!r.ok || !r.task) return { ok: false, error: r.error };
  const t = tasks.find((t) => t.id === id);
  if (t) {
    t.thread = r.task.thread ?? t.thread ?? [];
    t.attachments = r.task.attachments ?? t.attachments ?? [];
    emit();
  }
  return { ok: true };
}
