import { useSyncExternalStore } from "react";
import {
  createClientRequest, deleteClientRequest, fetchClients, updateClientRequest, type CrmClient,
} from "../api";

let clients: CrmClient[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  clients = [...clients];
  listeners.forEach((l) => l());
}

export function useClients(): CrmClient[] {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => clients,
  );
}

/* Сброс при смене сессии — та же причина, что и для tasks store:
   иначе клиенты, увиденные под одной ролью, остаются в памяти после
   переключения на другую роль в той же вкладке. */
export function resetClientsStore() {
  hydrated = false;
  clients = [];
  emit();
}

export async function hydrateClients() {
  if (hydrated) return;
  hydrated = true;
  try {
    const rows = await fetchClients();
    clients = rows;
    emit();
  } catch {
    hydrated = false; /* дадим шанс перезагрузить при следующем обращении */
  }
}

export async function createClient(data: {
  company: string; phone?: string; position?: string; tariff?: string; assignedTo?: string; note?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const r = await createClientRequest(data);
  if (r.ok && r.client) {
    clients = [r.client, ...clients.filter((c) => c.id !== r.client!.id)];
    emit();
  }
  return { ok: r.ok, error: r.error };
}

export async function patchClient(
  id: string,
  patch: Partial<Pick<CrmClient, "status" | "assignedTo" | "tariff" | "note" | "position" | "inn" | "mfo" | "bankAccount" | "address">>,
): Promise<{ ok: boolean; error?: string }> {
  const r = await updateClientRequest(id, patch);
  if (r.ok && r.client) {
    clients = clients.map((c) => (c.id === id ? r.client! : c));
    emit();
  }
  return { ok: r.ok, error: r.error };
}

export async function removeClient(id: string): Promise<{ ok: boolean; error?: string }> {
  const r = await deleteClientRequest(id);
  if (r.ok) {
    clients = clients.filter((c) => c.id !== id);
    emit();
  }
  return { ok: r.ok, error: r.error };
}
