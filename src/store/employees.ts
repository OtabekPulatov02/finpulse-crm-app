import { useSyncExternalStore } from "react";
import {
  createEmployeeRequest, deleteEmployeeRequest, fetchEmployees, resetEmployeePasswordRequest,
  updateEmployeeRequest, type CrmEmployee,
} from "../api";

let employees: CrmEmployee[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  employees = [...employees];
  listeners.forEach((l) => l());
}

export function useEmployees(): CrmEmployee[] {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => employees,
  );
}

export function resetEmployeesStore() {
  hydrated = false;
  employees = [];
  emit();
}

export async function hydrateEmployees() {
  if (hydrated) return;
  hydrated = true;
  try {
    const rows = await fetchEmployees();
    employees = rows;
    emit();
  } catch {
    hydrated = false;
  }
}

export async function createEmployee(data: { name: string; phone: string; role: "admin" | "accountant" }) {
  const r = await createEmployeeRequest(data);
  if (r.ok && r.employee) {
    employees = [r.employee, ...employees];
    emit();
  }
  return r;
}

export async function patchEmployee(id: string, patch: Partial<Pick<CrmEmployee, "name" | "role" | "active">>) {
  const r = await updateEmployeeRequest(id, patch);
  if (r.ok && r.employee) {
    employees = employees.map((e) => (e.id === id ? r.employee! : e));
    emit();
  }
  return r;
}

export async function resetEmployeePassword(id: string) {
  const r = await resetEmployeePasswordRequest(id);
  if (r.ok && r.employee) {
    employees = employees.map((e) => (e.id === id ? r.employee! : e));
    emit();
  }
  return r;
}

export async function removeEmployee(id: string) {
  const r = await deleteEmployeeRequest(id);
  if (r.ok) {
    employees = employees.filter((e) => e.id !== id);
    emit();
  }
  return r;
}
