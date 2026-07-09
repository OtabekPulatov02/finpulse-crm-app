import { useEffect, useState } from "react";
import {
  Archive, CheckCircle2, ExternalLink, MoreHorizontal, Pencil, Plus, Search, Trash2, UserPlus,
} from "lucide-react";
import {
  Avatar, Badge, Card, ConfirmModal, Field, Input, Menu, MenuDivider,
  MenuItem, Modal, Select, Textarea, toast, type Tone,
} from "../components/ui";
import { EMPLOYEE_NAMES, clients, type Client } from "../data/demo";
import { fetchPending } from "../api";

const statusTone: Record<string, Tone> = {
  "Активный": "green", "Новый": "blue", "Из бота": "cyan", "В архиве": "gray",
};

const TAXES = ["УСН (доходы)", "УСН (доходы − расходы)", "ОСНО", "Патент", "АУСН"];

function ClientFormModal({ open, onClose, name }: { open: boolean; onClose: () => void; name?: string }) {
  const edit = !!name;
  return (
    <Modal open={open} onClose={onClose} title={edit ? "Изменить клиента" : "Новый клиент"} wide
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium hover:bg-slate-50">Отмена</button>
          <button
            onClick={() => { toast(edit ? "Данные клиента обновлены" : "Клиент создан — карточка добавлена в систему"); onClose(); }}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700">
            <Plus className="size-4" /> {edit ? "Сохранить" : "Создать клиента"}
          </button>
        </>
      }>
      <div className="space-y-4">
        <Field label="Название компании" required>
          <Input placeholder="ООО «Название»" defaultValue={name} autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <Field label="ИНН" required><Input placeholder="7701234567" /></Field>
          <Field label="Система налогообложения">
            <Select>{TAXES.map((t) => <option key={t}>{t}</option>)}</Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <Field label="Контактное лицо"><Input placeholder="ФИО" /></Field>
          <Field label="Телефон"><Input type="tel" placeholder="+998 90 000-00-00" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <Field label="Электронная почта"><Input type="email" placeholder="info@company.uz" /></Field>
          <Field label="Ответственный бухгалтер">
            <Select>{EMPLOYEE_NAMES.map((n) => <option key={n}>{n}</option>)}</Select>
          </Field>
        </div>
        <Field label="Комментарий"><Textarea placeholder="Комментарий" /></Field>
      </div>
    </Modal>
  );
}

export default function Clients() {
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("Все статусы");
  const [createOpen, setCreateOpen] = useState(false);
  const [editName, setEditName] = useState<string | null>(null);
  const [archiveName, setArchiveName] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string | null>(null);
  const [botClients, setBotClients] = useState<Client[]>([]);
  useEffect(() => {
    fetchPending().then((rows) => {
      const known = new Set(clients.map((c) => c.name.toLowerCase()));
      setBotClients(rows
        .filter((r) => r.company && !known.has(r.company.toLowerCase()))
        .map((r) => ({
          name: r.company, inn: "—", tax: "—", contact: "клиент из бота",
          phone: r.phone ?? "—", manager: "не назначен", status: "Из бота" as const, activeTasks: 0,
        })));
    }).catch(() => {});
  }, []);
  const allClients = [...botClients, ...clients];

  const filtered = allClients.filter((c) =>
    (c.name + c.contact + c.inn).toLowerCase().includes(q.toLowerCase()) &&
    (fStatus === "Все статусы" || c.status === fStatus)
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Клиенты</h1>
          <p className="mt-0.5 text-sm text-slate-500">48 компаний · 1 из бота ожидает активации</p>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700">
          <Plus className="size-4" /> Добавить клиента
        </button>
      </div>

      <Card>
        <div className="flex flex-wrap gap-2.5 border-b border-slate-200 p-4">
          <div className="relative min-w-56 max-w-xs flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по названию, ИНН, контакту" className="!pl-9" />
          </div>
          <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="!w-auto">
            <option>Все статусы</option>
            {Object.keys(statusTone).map((s) => <option key={s}>{s}</option>)}
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold tracking-wider text-slate-400 uppercase">
                <th className="px-4 py-3">Компания</th>
                <th className="px-4 py-3">Контакт</th>
                <th className="px-4 py-3">Ответственный</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Задачи</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.name} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-slate-400">ИНН {c.inn} · {c.tax}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{c.contact}</div>
                    <div className="text-xs text-slate-400">{c.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    {c.manager === "не назначен" ? (
                      <span className="text-slate-400">не назначен</span>
                    ) : (
                      <span className="flex items-center gap-2"><Avatar name={c.manager} />{c.manager}</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><Badge tone={statusTone[c.status]}>{c.status}</Badge></td>
                  <td className="px-4 py-3 font-semibold">{c.activeTasks}</td>
                  <td className="px-4 py-3 text-right">
                    <Menu trigger={
                      <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                        <MoreHorizontal className="size-4" />
                      </button>
                    }>
                      <MenuItem icon={<ExternalLink className="size-4" />} onClick={() => setEditName(c.name)}>Открыть карточку</MenuItem>
                      {c.status === "Из бота" && (
                        <MenuItem icon={<CheckCircle2 className="size-4" />}
                          onClick={() => toast("Клиент активирован — назначьте ответственного бухгалтера")}>
                          Активировать
                        </MenuItem>
                      )}
                      <MenuItem icon={<Pencil className="size-4" />} onClick={() => setEditName(c.name)}>Изменить</MenuItem>
                      <MenuItem icon={<UserPlus className="size-4" />} onClick={() => toast("Ответственный бухгалтер обновлён")}>Сменить ответственного</MenuItem>
                      <MenuDivider />
                      <MenuItem icon={<Archive className="size-4" />} onClick={() => setArchiveName(c.name)}>Архивировать</MenuItem>
                      <MenuItem danger icon={<Trash2 className="size-4" />} onClick={() => setDeleteName(c.name)}>Удалить</MenuItem>
                    </Menu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <div className="p-10 text-center text-sm text-slate-400">Ничего не найдено</div>
          )}
        </div>
      </Card>

      <ClientFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      {editName && <ClientFormModal open onClose={() => setEditName(null)} name={editName} />}
      <ConfirmModal
        open={!!archiveName}
        onClose={() => setArchiveName(null)}
        onConfirm={() => toast("Клиент архивирован — карточка перемещена в архив")}
        title="Архивировать клиента?"
        text="Клиент будет перемещён в архив. Активные задачи останутся доступны, новые задачи создавать будет нельзя."
        confirmLabel="Архивировать" tone="warning"
        icon={<Archive className="size-5" />}
      />
      <ConfirmModal
        open={!!deleteName}
        onClose={() => setDeleteName(null)}
        onConfirm={() => toast("Клиент удалён из системы")}
        title="Удалить клиента?"
        text="Это действие нельзя отменить. Все связанные задачи, комментарии и файлы будут также удалены."
        icon={<Trash2 className="size-5" />}
      />
    </div>
  );
}
