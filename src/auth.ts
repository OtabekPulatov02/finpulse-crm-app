import { useSyncExternalStore } from "react";

export type Role = "admin" | "accountant" | "client" | "guest";

export interface Session {
  token: string;
  role: Role;
  name: string;
  company?: string;
}

const STORAGE_KEY = "finpulse_session";
const listeners = new Set<() => void>();

function load(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

let session: Session | null = load();

function emit() {
  listeners.forEach((l) => l());
}

export function useSession(): Session | null {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => session,
  );
}

export function getSession(): Session | null {
  return session;
}

export function getToken(): string | null {
  return session?.token ?? null;
}

export function setSession(s: Session) {
  session = s;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* noop */ }
  emit();
}

export function clearSession() {
  session = null;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  emit();
}

/* Ярлыки ролей для интерфейса */
export const ROLE_LABEL: Record<Role, string> = {
  admin: "Супер-админ",
  accountant: "Бухгалтер",
  client: "Клиент",
  guest: "Гость",
};
