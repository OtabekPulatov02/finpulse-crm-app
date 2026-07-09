import { useSyncExternalStore } from "react";
import { initialTasks, type Task, type TaskStatus } from "../data/demo";

let tasks: Task[] = [...initialTasks];
const listeners = new Set<() => void>();

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

export function setTaskStatus(id: number, status: TaskStatus) {
  const t = tasks.find((t) => t.id === id);
  if (t && t.status !== status) { t.status = status; emit(); }
}

export function updateTask(id: number, patch: Partial<Task>) {
  const t = tasks.find((t) => t.id === id);
  if (t) { Object.assign(t, patch); emit(); }
}

export function addTask(data: Omit<Task, "id">): Task {
  const id = Math.max(...tasks.map((t) => t.id)) + 1;
  const t = { id, ...data };
  tasks = [t, ...tasks];
  emit();
  return t;
}

export function removeTask(id: number) {
  tasks = tasks.filter((t) => t.id !== id);
  emit();
}
