import type { Tone } from "../components/ui";

export type TaskStatus = "Новая" | "В работе" | "Выполнена" | "Архив";
/* Статусы, которые можно выбрать вручную при создании/редактировании —
   "Архив" не входит: задача попадает туда автоматически через 24ч после
   выполнения (см. displayStatus в store/tasks.ts), назначить его напрямую нельзя. */
export const EDITABLE_STATUSES: TaskStatus[] = ["Новая", "В работе", "Выполнена"];
export type Priority = "Низкий" | "Средний" | "Высокий" | "Критический";

export const STATUSES: TaskStatus[] = ["Новая", "В работе", "Выполнена", "Архив"];
export const PRIORITIES: Priority[] = ["Низкий", "Средний", "Высокий", "Критический"];

export const statusTone: Record<TaskStatus, Tone> = {
  "Новая": "purple", "В работе": "blue", "Выполнена": "green", "Архив": "gray",
};
export const priorityTone: Record<Priority, Tone> = {
  "Низкий": "gray", "Средний": "blue", "Высокий": "yellow", "Критический": "red",
};

export interface TaskAttachment {
  index: number;
  kind: "photo" | "document" | "video" | "voice" | "audio";
}

export interface Task {
  id: number;
  title: string;
  client: string;
  clientId?: string | null;
  assignee: string;
  status: TaskStatus;
  priority: Priority;
  due: string;
  dueDate?: string | null;
  doneAt?: string | null;
  source?: "bot" | "crm";
  fromBot?: boolean;
  fromCalendar?: boolean;
  description?: string;
  created?: string;
  attachments?: TaskAttachment[];
}

