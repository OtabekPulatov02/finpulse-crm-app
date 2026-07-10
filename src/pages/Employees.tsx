import { useEffect, useMemo, useState } from "react";
import { Copy, KeyRound, MoreHorizontal, Pencil, Trash2, UserPlus } from "lucide-react";
import {
  Avatar, Badge, Card, ConfirmModal, Field, Input, Menu, MenuDivider, MenuItem, Modal, Select, toast,
} from "../components/ui";
import type { CrmEmployee } from "../api";
import {
  createEmployee, hydrateEmployees, patchEmployee, removeEmployee, resetEmployeePassword, useEmployees,
} from "../store/employees";
import { hydrateClients, useClients } from "../store/clients";
import { hydrateFromBot, useTasks } from "../store/tasks";
import { formatPhone } from "../lib/phone";

const ROLE_LABEL: Record<string, string> = { admin: "Администратор", accountant: "Бухгалтер" };

function PasswordRevealModal({ password, onClose }: { password: string | null; onClose: () => void }) {
  if (!password) return null;
  return (
    <Modal open onClose={onClose} title="Пароль создан"
      footer={<button onClick={onClose} className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Готово</button>}>
      <p className="mb-3 text-[13px] text-slate-500">
        Сообщите сотруднику логин (его телефон) и пароль ниже — повторно пароль показать нельзя, только сбросить новый.
      </p>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
        <code className="flex-1 text-[15px] font-semibold tracking-wide">{password}</code>
        <button
          onClick={() => { navigator.clipboard?.writeText(password); toast("Пароль скопирован"); }}
          className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-slate-700">
          <Copy className="size-4" />
        </button>
      </div>
    </Modal>
  );
}

function EmployeeFormModal({
  open, onClose, employee, onCreated,
}: { open: boolean; onClose: () => void; employee?: CrmEmployee | null; onCreated: (password: string) => void }) {
  const edit = !!employee;
  const [name, setName] = useState(employee?.name ?? "");
  const [phone, setPhone] = useState(edit ? formatPhone(employee?.phone ?? "") : "");
  const [role, setRole] = useState<"admin" | "accountant">(employee?.role ?? "accountant");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) { toast("Укажите имя сотрудника"); return; }
    if (!edit && !phone.trim()) { toast("Укажите телефон — он будет логином"); return; }
    setSaving(true);
    try {
      if (edit && employee) {
        const r = await patchEmployee(employee.id, { name: name.trim(), role });
        if (!r.ok) { toast(r.error || "Не удалось сохранить"); return; }
        toast("Данные сотрудника обновлены");
      } else {
        const r = await createEmployee({ name: name.trim(), phone: phone.trim(), role });
        if (!r.ok || !r.password) {
          toast(r.error === "phone already used by another employee" ? "Такой телефон уже используется другим сотрудником"
            : r.error === "phone already used by a client" ? "Этот телефон уже привязан к клиенту"
            : (r.error || "Не удалось создать сотрудника"));
          return;
        }
        onCreated(r.password);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={edit ? "Изменить сотрудника" : "Новый сотрудник"} wide
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium hover:bg-slate-50">Отмена</button>
          <button disabled={saving} onClick={submit}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700 disabled:opacity-60">
            <UserPlus className="size-4" /> {saving ? "Сохраняем…" : edit ? "Сохранить" : "Создать доступ"}
          </button>
        </>
      }>
      <div className="space-y-4">
        <Field label="Имя и фамилия" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Мария Петрова" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <Field label="Телефон (логин)" required={!edit}>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 000-00-00" disabled={edit} />
          </Field>
          <Field label="Роль в системе">
            <Select value={role} onChange={(e) => setRole(e.target.value as "admin" | "accountant")}>
              <option value="accountant">Бухгалтер</option>
              <option value="admin">Администратор</option>
            </Select>
          </Field>
        </div>
        {!edit && (
          <p className="text-xs text-slate-400">
            Пароль сгенерируется автоматически и будет показан один раз сразу после создания.
          </p>
        )}
        {edit && <p className="text-xs text-slate-400">Телефон (логин) нельзя изменить — при необходимости сбросьте пароль или удалите и создайте заново.</p>}
      </div>
    </Modal>
  );
}

export default function Employees() {
  const employees = useEmployees();
  const clients = useClients();
  const tasks = useTasks();
  useEffect(() => { void hydrateEmployees(); void hydrateClients(); void hydrateFromBot(); }, []);

  const [createOpen, setCreateOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<CrmEmployee | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<CrmEmployee | null>(null);
  const [revealPassword, setRevealPassword] = useState<string | null>(null);

  const stats = useMemo(() => {
    const map = new Map<string, { clients: number; active: number; done: number }>();
    for (const e of employees) map.set(e.name, { clients: 0, active: 0, done: 0 });
    for (const c of clients) {
      if (c.assignedTo && map.has(c.assignedTo)) map.get(c.assignedTo)!.clients++;
    }
    for (const t of tasks) {
      if (!map.has(t.assignee)) continue;
      if (t.status === "Выполнена") map.get(t.assignee)!.done++;
      else if (t.status === "Новая" || t.status === "В работе") map.get(t.assignee)!.active++;
    }
    return map;
  }, [employees, clients, tasks]);

  const activeCount = employees.filter((e) => e.active).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Сотрудники</h1>
          <p className="mt-0.5 text-sm text-slate-500">{employees.length} сотрудников · {activeCount} активны</p>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700">
          <UserPlus className="size-4" /> Добавить сотрудника
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        {employees.map((e) => {
          const s = stats.get(e.name) || { clients: 0, active: 0, done: 0 };
          return (
            <Card key={e.id} className="p-5">
              <div className="flex items-start gap-3">
                <Avatar name={e.name} className="!size-11 !text-sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold">{e.name}</div>
                  <div className="truncate text-xs text-slate-400">{ROLE_LABEL[e.role] ?? e.role}</div>
                  <div className="mt-1 text-xs text-slate-400">{e.phone ? formatPhone(e.phone) : "—"}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge tone={e.active ? "green" : "gray"}>{e.active ? "Активен" : "Отключён"}</Badge>
                  <Menu trigger={
                    <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                      <MoreHorizontal className="size-4" />
                    </button>
                  }>
                    <MenuItem icon={<Pencil className="size-4" />} onClick={() => setEditEmployee(e)}>Изменить</MenuItem>
                    <MenuItem
                      icon={<KeyRound className="size-4" />}
                      onClick={async () => {
                        const r = await resetEmployeePassword(e.id);
                        if (r.ok && r.password) setRevealPassword(r.password);
                        else toast(r.error || "Не удалось сбросить пароль");
                      }}>
                      Сбросить пароль
                    </MenuItem>
                    <MenuItem
                      icon={<Pencil className="size-4" />}
                      onClick={async () => {
                        const r = await patchEmployee(e.id, { active: !e.active });
                        toast(r.ok ? (e.active ? "Доступ отключён" : "Доступ включён") : (r.error || "Не удалось изменить"));
                      }}>
                      {e.active ? "Отключить доступ" : "Включить доступ"}
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem danger icon={<Trash2 className="size-4" />} onClick={() => setDeleteEmployee(e)}>Удалить</MenuItem>
                  </Menu>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 border-t border-slate-100 pt-3.5 text-center">
                <div><div className="text-base font-bold">{s.clients}</div><div className="text-[11px] text-slate-400">Клиенты</div></div>
                <div><div className="text-base font-bold">{s.active}</div><div className="text-[11px] text-slate-400">Активные</div></div>
                <div><div className="text-base font-bold">{s.done}</div><div className="text-[11px] text-slate-400">Выполнено</div></div>
              </div>
            </Card>
          );
        })}
        {!employees.length && (
          <div className="col-span-full rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
            Сотрудников пока нет — добавьте первого.
          </div>
        )}
      </div>

      <EmployeeFormModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(p) => setRevealPassword(p)} />
      {editEmployee && (
        <EmployeeFormModal open onClose={() => setEditEmployee(null)} employee={editEmployee} onCreated={() => {}} />
      )}
      <PasswordRevealModal password={revealPassword} onClose={() => setRevealPassword(null)} />
      <ConfirmModal
        open={!!deleteEmployee}
        onClose={() => setDeleteEmployee(null)}
        onConfirm={async () => {
          if (!deleteEmployee) return;
          const r = await removeEmployee(deleteEmployee.id);
          toast(r.ok ? "Сотрудник удалён" : (r.error === "forbidden" ? "Удаление доступно только супер-админу" : (r.error || "Не удалось удалить")));
        }}
        title="Удалить сотрудника?"
        text="Доступ к CRM будет отозван немедленно. Задачи, назначенные на него ранее, останутся как есть."
        icon={<Trash2 className="size-5" />}
      />
    </div>
  );
}
