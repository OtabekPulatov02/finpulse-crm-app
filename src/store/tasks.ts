import { useSyncExternalStore } from "react";
import { fetchBotTasks, pushBotStatus, fmtTs, type BotStatus } from "../api";
import { initialTasks, type Task, type TaskStatus } from "../data/demo";

let tasks: Task[] = [...initialTasks];
const listeners = new Set<() => void>();

/* id реальных задач из Telegram-бота — их статусы синхронизируются с ботом */
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

const fromBotStatus: Record<BotStatus, TaskStatus> = {
  new: "Новая", in_progress: "В работе", done: "Выполнена",
};
const toBotStatus: Partial<Record<TaskStatus, BotStatus>> = {
  "Новая": "new", "В работе": "in_progress", "Выполнена": "done",
};

/* Подтягиваем реальные задачи из бота (однократно при загрузке приложения) */
export async function hydrateFromBot() {
  if (hydrated) return;
  hydrated = true;
  try {
    const bot = await fetchBotTasks();
    const live: Task[] = bot.map((b) => ({
      id: b.num,
      title: b.text.length > 80 ? b.text.slice(0, 77) + "…" : b.text,
      description: b.text.length > 80 ? b.text : undefined,
      client: b.company,
      assignee: b.assignee ?? "не назначен",
      status: fromBotStatus[b.status] ?? "Новая",
      priority: "Средний",
      due: "—",
      fromBot: true,
      created: fmtTs(b.createdAt),
    }));
    live.forEach((t) => liveIds.add(t.id));
    tasks = [...live, ...tasks.filter((t) => !liveIds.has(t.id))];
    emit();
  } catch {
    /* бот недоступен — работаем на демо-данных */
  }
}

export function setTaskStatus(id: number, status: TaskStatus) {
  const t = tasks.find((t) => t.id === id);
  if (!t || t.status === status) return;
  t.status = status;
  emit();
  /* живая задача из бота → шлём статус в Telegram (клиент получит уведомление) */
  const bs = toBotStatus[status];
  if (liveIds.has(id) && bs) {
    void pushBotStatus(id, bs, "Ибрагимова Юлдуз").catch(() => {});
  }
}

export function updateTask(id: number, patch: Partial<Task>) {
  const t = tasks.find((t) => t.id === id);
  if (t) { Object.assign(t, patch); emit(); }
}

export function addTask(data: Omit<Task, "id">): Task {
  const id = Math.max(...tasks.map((t) => t.id), 1300) + 1;
  const t = { id, ...data };
  tasks = [t, ...tasks];
  emit();
  return t;
}

export function removeTask(id: number) {
  tasks = tasks.filter((t) => t.id !== id);
  liveIds.delete(id);
  emit();
}
