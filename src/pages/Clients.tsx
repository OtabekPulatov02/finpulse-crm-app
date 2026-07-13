import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Archive, CheckCircle2, ExternalLink, MoreHorizontal, PackagePlus, Pencil, Plus, Search, ShieldAlert, Trash2, UserPlus,
} from "lucide-react";
import {
  Avatar, Badge, Card, ConfirmModal, Field, Input, Menu, MenuDivider,
  MenuItem, Modal, Select, Textarea, toast, type Tone,
} from "../components/ui";
import { useEmployees, hydrateEmployees } from "../store/employees";
import type { AccessRequest, CrmClient } from "../api";
import { fetchAccessRequests, resolveAccessRequest, addOpsPack, fetchTariffs, fetchUsage, type ClientUsage, type Tariff } from "../api";
import { createClient, hydrateClients, patchClient, removeClient, useClients } from "../store/clients";
import { formatPhone } from "../lib/phone";
import { formatSumsInText } from "../lib/amount";

const STATUS_LABEL: Record<string, string> = {
  active: "Активный", pending: "Ожидает активации", archived: "В архиве",
};
const statusTone: Record<string, Tone> = {
  active: "green", pending: "cyan", archived: "gray",
};
const STATUSES = ["active", "pending", "archived"];

function ClientFormModal({
  open, onClose, client, tariffNames,
}: { open: boolean; onClose: () => void; client?: CrmClient | null; tariffNames: string[] }) {
  const employees = useEmployees();
  useEffect(() => { void hydrateEmployees(); }, []);
  const employeeNames = employees.filter((e) => e.active).map((e) => e.name);
  const edit = !!client;
  const [company, setCompany] = useState(client?.company ?? "");
  const [phone, setPhone] = useState(edit ? formatPhone(client?.phone ?? "") : "");
  const [position, setPosition] = useState(client?.position ?? "");
  const [tariff, setTariff] = useState(client?.tariff ?? tariffNames[0] ?? "");
  const [assignedTo, setAssignedTo] = useState(client?.assignedTo ?? employeeNames[0] ?? "");
  const [note, setNote] = useState(client?.note ?? "");
  const [inn, setInn] = useState(client?.inn ?? "");
  const [mfo, setMfo] = useState(client?.mfo ?? "");
  const [bankAccount, setBankAccount] = useState(client?.bankAccount ?? "");
  const [address, setAddress] = useState(client?.address ?? "");
  const [fullName, setFullName] = useState(client?.fullName ?? "");
  const [pinfl, setPinfl] = useState(client?.pinfl ?? "");
  const [vatCode, setVatCode] = useState(client?.vatCode ?? "");
  const [taxSystem, setTaxSystem] = useState(client?.taxSystem ?? "");
  const [bank, setBank] = useState(client?.bank ?? "");
  const [director, setDirector] = useState(client?.director ?? "");
  const [taxOffice, setTaxOffice] = useState(client?.taxOffice ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!edit && !company.trim()) { toast("Укажите название компании"); return; }
    setSaving(true);
    try {
      if (edit && client) {
        const r = await patchClient(client.id, {
          position: position || null, tariff: tariff || null, assignedTo: assignedTo || null, note: note || null,
          inn: inn || null, mfo: mfo || null, bankAccount: bankAccount || null, address: address || null,
          fullName: fullName || null, pinfl: pinfl || null, vatCode: vatCode || null, taxSystem: taxSystem || null,
          bank: bank || null, director: director || null, taxOffice: taxOffice || null,
        });
        if (!r.ok) { toast(r.error || "Не удалось сохранить изменения"); return; }
        toast("Данные клиента обновлены");
      } else {
        const r = await createClient({ company: company.trim(), phone: phone.trim() || undefined, position: position || undefined, tariff, assignedTo, note: note || undefined });
        if (!r.ok) { toast(r.error === "phone belongs to a different client" ? "Этот телефон уже привязан к другому клиенту" : (r.error || "Не удалось создать клиента")); return; }
        toast("Клиент создан — карточка добавлена в систему");
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={edit ? "Изменить клиента" : "Новый клиент"} wide
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium hover:bg-slate-50">Отмена</button>
          <button disabled={saving} onClick={submit}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700 disabled:opacity-60">
            <Plus className="size-4" /> {saving ? "Сохраняем…" : edit ? "Сохранить" : "Создать клиента"}
          </button>
        </>
      }>
      <div className="space-y-4">
        <Field label="Название компании" required>
          <Input placeholder="ООО «Название»" value={company} onChange={(e) => setCompany(e.target.value)} disabled={edit} autoFocus={!edit} />
        </Field>
        {edit && <p className="-mt-2 text-xs text-slate-400">Название и телефон компании нельзя изменить из карточки — они привязаны к регистрации в Telegram.</p>}
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <Field label="Телефон"><Input type="tel" placeholder="+998 90 000-00-00" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={edit} /></Field>
          <Field label="Должность контакта"><Input placeholder="Главный бухгалтер" value={position} onChange={(e) => setPosition(e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <Field label="Тариф">
            <Select value={tariff} onChange={(e) => setTariff(e.target.value)}>{(tariffNames.length ? tariffNames : [tariff]).map((t) => <option key={t}>{t}</option>)}</Select>
          </Field>
          <Field label="Ответственный бухгалтер">
            <Select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
              {!employeeNames.length && <option value="">Нет сотрудников</option>}
              {employeeNames.map((n) => <option key={n}>{n}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Комментарий"><Textarea value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => setNote((v) => formatSumsInText(v))} placeholder="Комментарий" /></Field>
        {edit && (
          <>
            <div className="pt-1 text-[13px] font-semibold text-slate-500">Реквизиты компании</div>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <Field label="ИНН"><Input value={inn} onChange={(e) => setInn(e.target.value)} placeholder="123456789" /></Field>
              <Field label="МФО"><Input value={mfo} onChange={(e) => setMfo(e.target.value)} placeholder="00014" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <Field label="Расчётный счёт"><Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="2020 8000 ..." /></Field>
              <Field label="Юридический адрес"><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="г. Ташкент, ..." /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <Field label="Полное наименование (1С)"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="«…» Mas'uliyati Cheklangan Jamiyati" /></Field>
              <Field label="ПИНФЛ"><Input value={pinfl} onChange={(e) => setPinfl(e.target.value)} placeholder="14 цифр" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <Field label="Рег. код НДС"><Input value={vatCode} onChange={(e) => setVatCode(e.target.value)} placeholder="326…" /></Field>
              <Field label="Система налогообложения">
                <Select value={taxSystem} onChange={(e) => setTaxSystem(e.target.value)}>
                  <option value="">—</option><option>Общеустановленная (НДС)</option><option>Упрощённая (налог с оборота)</option><option>Фиксированный налог ИП</option>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <Field label="Банк"><Input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="«Orient Finans» XATB …" /></Field>
              <Field label="Директор"><Input value={director} onChange={(e) => setDirector(e.target.value)} placeholder="ФИО" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <Field label="Налоговая инспекция (код)"><Input value={taxOffice} onChange={(e) => setTaxOffice(e.target.value)} placeholder="2603" /></Field>
              {client?.source1c && <Field label="Источник 1С"><Input value={client.source1c.name + " · " + client.source1c.app} disabled /></Field>}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}


const REQ_LABEL: Record<AccessRequest["type"], string> = {
  phone_mismatch: "Телефон не совпадает с карточкой клиента",
  phone_conflict: "Телефон уже привязан к другой компании",
  telegram_rebind: "Новый Telegram-аккаунт просит доступ к компании",
};

function AccessRequestsBlock() {
  const [reqs, setReqs] = useState<AccessRequest[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    fetchAccessRequests().then((all) => setReqs(all.filter((r) => r.status === "pending"))).catch(() => {});
  }, []);
  if (!reqs.length) return null;

  const resolve = async (r: AccessRequest, approve: boolean) => {
    setBusy(r.id);
    try {
      const res = await resolveAccessRequest(r.id, approve);
      if (!res.ok) { toast(res.error || "Не удалось обработать заявку"); return; }
      setReqs((s) => s.filter((x) => x.id !== r.id));
      toast(approve ? "Доступ выдан — клиент получил логин и пароль в Telegram" : "Заявка отклонена — клиент уведомлён");
    } finally { setBusy(null); }
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <div className="flex items-center gap-2.5 border-b border-amber-200/70 px-5 py-3.5">
        <ShieldAlert className="size-[18px] text-amber-600" />
        <h2 className="text-[14px] font-semibold text-amber-800">Заявки на доступ — нужна проверка ({reqs.length})</h2>
      </div>
      <div className="divide-y divide-amber-100">
        {reqs.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold">{r.company || "—"}</div>
              <div className="mt-0.5 text-[12.5px] text-slate-600">
                {REQ_LABEL[r.type]}
                {r.claimedPhone && <> · заявленный телефон: <b>{r.claimedPhone}</b></>}
                {r.knownPhone && <> · в карточке: <b>{r.knownPhone}</b></>}
                {r.otherCompany && <> · телефон закреплён за: <b>{r.otherCompany}</b></>}
                {r.tgName && <> · от: {r.tgName}</>}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button disabled={busy === r.id} onClick={() => resolve(r, true)}
                className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-[12.5px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                Выдать доступ
              </button>
              <button disabled={busy === r.id} onClick={() => resolve(r, false)}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                Отклонить
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Clients() {
  const clients = useClients();
  useEffect(() => { void hydrateClients(); }, []);
  const [usage, setUsage] = useState<Record<string, ClientUsage>>({});
  const [tariffList, setTariffList] = useState<Tariff[]>([]);
  useEffect(() => {
    fetchUsage().then(setUsage).catch(() => {});
    fetchTariffs().then(setTariffList).catch(() => {});
  }, []);
  const tariffNames = tariffList.map((t) => t.name);

  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("Все статусы");
  const [createOpen, setCreateOpen] = useState(false);
  const [editClient, setEditClient] = useState<CrmClient | null>(null);
  const [archiveClient, setArchiveClient] = useState<CrmClient | null>(null);
  const [deleteClient, setDeleteClient] = useState<CrmClient | null>(null);

  /* Открытие карточки клиента по ссылке из поиска в шапке (?open=<id>) */
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId || !clients.length) return;
    const c = clients.find((c) => c.id === openId);
    if (c) setEditClient(c);
    setSearchParams((p) => { p.delete("open"); return p; }, { replace: true });
  }, [searchParams, clients, setSearchParams]);

  const filtered = clients.filter((c) =>
    (c.company + (c.position || "") + (c.phone || "")).toLowerCase().includes(q.toLowerCase()) &&
    (fStatus === "Все статусы" || c.status === fStatus)
  );
  const pendingCount = clients.filter((c) => c.status === "pending").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Клиенты</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {clients.length} {clients.length === 1 ? "компания" : "компаний"}
            {pendingCount > 0 && ` · ${pendingCount} ожидает активации`}
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700">
          <Plus className="size-4" /> Добавить клиента
        </button>
      </div>

      <AccessRequestsBlock />

      <Card>
        <div className="flex flex-wrap gap-2.5 border-b border-slate-200 p-4">
          <div className="relative min-w-56 max-w-xs flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по названию, телефону, должности" className="!pl-9" />
          </div>
          <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="!w-auto">
            <option>Все статусы</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold tracking-wider text-slate-400 uppercase">
                <th className="px-4 py-3">Компания</th>
                <th className="px-4 py-3">Телефон</th>
                <th className="px-4 py-3">Ответственный</th>
                <th className="px-4 py-3">Тариф</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{c.company}</div>
                    {c.position && <div className="text-xs text-slate-400">{c.position}</div>}
                  </td>
                  <td className="px-4 py-3">{c.phone ? formatPhone(c.phone) : "—"}</td>
                  <td className="px-4 py-3">
                    {!c.assignedTo ? (
                      <span className="text-slate-400">не назначен</span>
                    ) : (
                      <span className="flex items-center gap-2"><Avatar name={c.assignedTo} />{c.assignedTo}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div>{c.tariff || "—"}</div>
                    {usage[c.id] && (
                      <div className={`mt-0.5 text-[11px] ${usage[c.id].over ? "font-semibold text-red-600" : "text-slate-400"}`}>
                        {usage[c.id].used}/{usage[c.id].limit == null ? "∞" : usage[c.id].limit} опер.
                        {usage[c.id].extraPacks > 0 && ` · +${usage[c.id].extraPacks} пак.`}
                        {usage[c.id].over && " · сверхлимит!"}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3"><Badge tone={statusTone[c.status] ?? "gray"}>{STATUS_LABEL[c.status] ?? c.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <Menu trigger={
                      <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                        <MoreHorizontal className="size-4" />
                      </button>
                    }>
                      <MenuItem icon={<ExternalLink className="size-4" />} onClick={() => setEditClient(c)}>Открыть карточку</MenuItem>
                      {c.status === "pending" && (
                        <MenuItem icon={<CheckCircle2 className="size-4" />}
                          onClick={async () => { const r = await patchClient(c.id, { status: "active" }); toast(r.ok ? "Клиент активирован" : (r.error || "Не удалось активировать")); }}>
                          Активировать
                        </MenuItem>
                      )}
                      <MenuItem icon={<Pencil className="size-4" />} onClick={() => setEditClient(c)}>Изменить</MenuItem>
                      <MenuItem icon={<UserPlus className="size-4" />} onClick={() => setEditClient(c)}>Сменить ответственного</MenuItem>
                      <MenuItem icon={<PackagePlus className="size-4" />}
                        onClick={async () => {
                          const r = await addOpsPack(c.id, 1);
                          if (r.ok) { toast(`Пакет сверхлимита добавлен (всего в этом месяце: ${r.packs})`); fetchUsage().then(setUsage).catch(() => {}); }
                          else toast(r.error || "Не удалось добавить пакет");
                        }}>
                        + Пакет операций
                      </MenuItem>
                      <MenuDivider />
                      {c.status !== "archived" && (
                        <MenuItem icon={<Archive className="size-4" />} onClick={() => setArchiveClient(c)}>Архивировать</MenuItem>
                      )}
                      <MenuItem danger icon={<Trash2 className="size-4" />} onClick={() => setDeleteClient(c)}>Удалить</MenuItem>
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

      <ClientFormModal open={createOpen} onClose={() => setCreateOpen(false)} tariffNames={tariffNames} />
      {editClient && <ClientFormModal open onClose={() => setEditClient(null)} client={editClient} tariffNames={tariffNames} />}
      <ConfirmModal
        open={!!archiveClient}
        onClose={() => setArchiveClient(null)}
        onConfirm={async () => {
          if (!archiveClient) return;
          const r = await patchClient(archiveClient.id, { status: "archived" });
          toast(r.ok ? "Клиент архивирован — карточка перемещена в архив" : (r.error || "Не удалось архивировать"));
        }}
        title="Архивировать клиента?"
        text="Клиент будет перемещён в архив. Активные задачи останутся доступны, новые задачи создавать будет нельзя."
        confirmLabel="Архивировать" tone="warning"
        icon={<Archive className="size-5" />}
      />
      <ConfirmModal
        open={!!deleteClient}
        onClose={() => setDeleteClient(null)}
        onConfirm={async () => {
          if (!deleteClient) return;
          const r = await removeClient(deleteClient.id);
          toast(r.ok ? "Клиент удалён из системы" : (r.error === "forbidden" ? "Удаление доступно только супер-админу" : (r.error || "Не удалось удалить клиента")));
        }}
        title="Удалить клиента?"
        text="Это действие нельзя отменить. Карточка клиента будет удалена безвозвратно. Доступно только супер-админу."
        icon={<Trash2 className="size-5" />}
      />
    </div>
  );
}
