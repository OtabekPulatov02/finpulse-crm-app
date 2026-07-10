import { useSyncExternalStore } from "react";
import {
  createCalendarEventRequest, deleteCalendarEventRequest, fetchCalendarEvents, updateCalendarEventRequest,
  type CalendarEventEntry,
} from "../api";

let events: CalendarEventEntry[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  events = [...events];
  listeners.forEach((l) => l());
}

export function useCalendarEvents(): CalendarEventEntry[] {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => events,
  );
}

export function resetCalendarEventsStore() {
  hydrated = false;
  events = [];
  emit();
}

export async function hydrateCalendarEvents() {
  if (hydrated) return;
  hydrated = true;
  try {
    const rows = await fetchCalendarEvents();
    events = rows;
    emit();
  } catch {
    hydrated = false;
  }
}

export async function createCalendarEvent(data: {
  type: "tax" | "pay"; title: string; company?: string | null; date: string;
  repeat?: CalendarEventEntry["repeat"]; remindDays?: number;
}) {
  const r = await createCalendarEventRequest(data);
  if (r.ok && r.event) {
    events = [r.event, ...events];
    emit();
  }
  return r;
}

export async function removeCalendarEvent(id: string) {
  const r = await deleteCalendarEventRequest(id);
  if (r.ok) {
    events = events.filter((e) => e.id !== id);
    emit();
  }
  return r;
}

export async function editCalendarEvent(id: string, patch: Partial<{
  title: string; company: string | null; date: string;
  repeat: CalendarEventEntry["repeat"]; remindDays: number; active: boolean;
}>) {
  const r = await updateCalendarEventRequest(id, patch);
  if (r.ok && r.event) {
    events = events.map((e) => (e.id === id ? r.event! : e));
    emit();
  }
  return r;
}
