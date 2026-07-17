import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Building2, CalendarDays, Database, ExternalLink, ListTodo, Plus, Trash2 } from "lucide-react";
import { Badge, Card, CardHeader, toast } from "../components/ui";
import {
  fetchBotCategories, fetchBotPositions, fetchDicts, fetchTariffs, fetch1cDeptSummary,
  saveBotCategories, saveBotPositions, saveDicts, saveTariffs,
  type BotCategory, type Dicts, type Tariff, type DeptSummaryRow,
} from "../api";
import { EDITABLE_STATUSES, PRIORITIES, priorityTone, statusTone } from "../data/demo";

/* ============================================================
   Справочники — единая точка входа для всех настраиваемых
   перечней CRM, сгруппированная по категориям. Раньше это было
   разбросано по вкладкам "Настроек" (часть — реальные данные,
   часть — статичный демо-макет без сохранения). Теперь всё в
   одном месте, и всё, что можно редактировать — реально
   сохраняется в БД.
   ============================================================ */

const CATS = [
  { id: "tasks", label: "Задачи", icon: ListTodo },
  { id: "clients", label: "Клиенты", icon: Building2 },
  { id: "calendar", label: "Календарь", icon: CalendarDays },
  { id: "onec", label: "1С", icon: Database },
] as const;
type CatId = (typeof CATS)[number]["id"];

/* ---------------- Универсальный редактор списка строк ---------------- */
function EditableListCard({
  title, hint, items, onSave, placeholder,
}: {
  title: string; hint?: string; items: string[]; onSave: (items: string[]) => Promise<void>; placeholder: string;
}) {
  const [list, setList] = useState(items);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setList(items); setDirty(false); }, [items]);

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    setList((l) => [...l, v]);
    setDraft("");
    setDirty(true);
  };
  const remove = (i: number) => { setList((l) => l.filter((_, xi) => xi !== i)); setDirty(true); };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(list);
      toast(`«${title}» сохранено`);
      setDirty(false);
    } catch {
      toast("Не удалось сохранить");
    } finally { setSaving(false); }
  };

  return (
    <Card>
      <CardHeader title={title} />
      <div className="divide-y divide-slate-100">
        {list.map((v, i) => (
          <div key={i} className="flex items-center justify-between gap-3 px-5 py-2.5">
            <span className="text-[13.5px] font-medium">{v}</span>
            <button onClick={() => remove(i)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-3.5" /></button>
          </div>
        ))}
        {!list.length && <p className="px-5 py-4 text-center text-xs text-slate-400">Пусто</p>}
        <div className="flex items-center gap-2 px-5 py-3">
          <input value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") add(); }}
            placeholder={placeholder} className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] focus:border-brand-500 focus:outline-none" />
          <button onClick={add} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"><Plus className="size-3.5" />Добавить</button>
        </div>
      </div>
      {hint && <p className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-400">{hint}</p>}
      {dirty && (
        <div className="flex justify-end border-t border-slate-100 px-5 py-3">
          <button onClick={save} disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      )}
    </Card>
  );
}

/* ---------------- Задачи: категории/подкатегории бота + статусы/приоритеты (справочно) ---------------- */
function TasksDicts() {
  const [cats, setCats] = useState<BotCategory[] | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { fetchBotCategories().then((c) => setCats(c ?? [])).catch(() => setCats([])); }, []);

  const save = async () => {
    if (!cats) return;
    setSaving(true);
    try {
      const r = await saveBotCategories(cats);
      if (r.ok) toast("Категории сохранены");
      else toast(r.error || "Не удалось сохранить");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Категории и подкатегории заявок (Telegram-бот)" action={
          cats && <button onClick={() => setCats([...cats, { id: "cat" + Date.now().toString(36), name: "Новая категория", subs: [] }])}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] font-medium hover:bg-slate-50">
            <Plus className="size-3.5" /> Категория
          </button>
        } />
        {!cats ? (
          <div className="p-8 text-center text-sm text-slate-400">Загрузка…</div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {cats.map((c, i) => (
                <div key={c.id} className="flex flex-wrap items-start gap-3 px-5 py-3">
                  <input value={c.name} onChange={(e) => setCats(cats.map((x, xi) => xi === i ? { ...x, name: e.target.value } : x))}
                    className="w-56 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[13px] font-medium focus:border-brand-500 focus:outline-none" />
                  <input value={c.subs.join(", ")} placeholder="Подкатегории через запятую (пусто — сразу свободный текст)"
                    onChange={(e) => setCats(cats.map((x, xi) => xi === i ? { ...x, subs: e.target.value.split(",").map((v) => v.trimStart()) } : x))}
                    onBlur={(e) => setCats(cats.map((x, xi) => xi === i ? { ...x, subs: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) } : x))}
                    className="min-w-64 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[13px] focus:border-brand-500 focus:outline-none" />
                  <button onClick={() => setCats(cats.filter((_, xi) => xi !== i))} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-4" /></button>
                </div>
              ))}
              {!cats.length && <p className="px-5 py-6 text-center text-xs text-slate-400">Категорий пока нет</p>}
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
              <span className="text-[12.5px] text-slate-400">Клиент видит категории табами при создании заявки в боте.</span>
              <button onClick={save} disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700 disabled:opacity-50">
                {saving ? "Сохранение…" : "Сохранить"}
              </button>
            </div>
          </>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <Card>
          <CardHeader title="Статусы задач" />
          <div className="divide-y divide-slate-100">
            {[...EDITABLE_STATUSES, "Архив"].map((s) => (
              <div key={s} className="flex items-center justify-between px-5 py-3">
                <Badge tone={s === "Архив" ? "gray" : statusTone[s as (typeof EDITABLE_STATUSES)[number]]}>{s}</Badge>
                {s === "Архив" && <span className="text-xs text-slate-400">авто, через 24ч после выполнения</span>}
              </div>
            ))}
          </div>
          <p className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-400">Системные статусы — жёстко привязаны к логике задач (Kanban, бот, напоминания), поэтому не редактируются свободно.</p>
        </Card>
        <Card>
          <CardHeader title="Приоритеты" />
          <div className="divide-y divide-slate-100">
            {PRIORITIES.map((p) => (
              <div key={p} className="px-5 py-3"><Badge tone={priorityTone[p]}>{p}</Badge></div>
            ))}
          </div>
          <p className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-400">Системный список, используется в фильтрах и сортировке задач.</p>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Клиенты: должности + тарифы ---------------- */
function ClientsDicts() {
  const [positions, setPositions] = useState<string[] | null>(null);
  const [tariffs, setTariffs] = useState<Tariff[] | null>(null);
  const [savingTariffs, setSavingTariffs] = useState(false);
  useEffect(() => {
    fetchBotPositions().then(setPositions).catch(() => setPositions([]));
    fetchTariffs().then(setTariffs).catch(() => setTariffs([]));
  }, []);

  const upd = (i: number, k: keyof Tariff, v: string) =>
    setTariffs((r) => r!.map((t, idx) => idx === i ? { ...t, [k]: k === "name" ? v : v === "" ? null : Number(v.replace(/\D/g, "")) } : t));
  const num = (v: number | null) => (v == null ? "" : String(v));
  const saveTariffsNow = async () => {
    if (!tariffs) return;
    setSavingTariffs(true);
    try {
      const r = await saveTariffs(tariffs);
      if (r.ok) toast("Тарифы сохранены — лимиты применяются со следующего пересчёта");
      else toast(r.error || "Не удалось сохранить");
    } finally { setSavingTariffs(false); }
  };

  return (
    <div className="space-y-4">
      <EditableListCard
        title="Должности клиентов"
        hint="Показываются табами при регистрации в боте и в карточке клиента."
        items={positions ?? []}
        placeholder="Новая должность"
        onSave={async (list) => { const r = await saveBotPositions(list); if (!r.ok) throw new Error(r.error); setPositions(list); }}
      />

      <Card>
        <CardHeader title="Тарифы и лимиты операций" action={
          tariffs && <button onClick={() => setTariffs((r) => [...r!, { id: "t" + Date.now().toString(36), name: "Новый тариф", price: 0, monthlyLimit: 30, overPackOps: 10, overPackPrice: 0 }])}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] font-medium hover:bg-slate-50">
            <Plus className="size-3.5" /> Добавить тариф
          </button>
        } />
        {!tariffs ? <div className="p-8 text-center text-sm text-slate-400">Загрузка…</div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    <th className="px-4 py-3">Название</th>
                    <th className="px-4 py-3">Цена, сум/мес</th>
                    <th className="px-4 py-3">Лимит операций/мес</th>
                    <th className="px-4 py-3">Пакет сверхлимита, опер.</th>
                    <th className="px-4 py-3">Цена пакета, сум</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tariffs.map((t, i) => (
                    <tr key={t.id}>
                      <td className="px-4 py-2"><input value={t.name} onChange={(e) => upd(i, "name", e.target.value)} className="w-36 rounded-lg border border-slate-200 px-2.5 py-1.5 focus:border-brand-500 focus:outline-none" /></td>
                      <td className="px-4 py-2"><input value={num(t.price)} onChange={(e) => upd(i, "price", e.target.value)} className="w-28 rounded-lg border border-slate-200 px-2.5 py-1.5 focus:border-brand-500 focus:outline-none" /></td>
                      <td className="px-4 py-2"><input value={num(t.monthlyLimit)} onChange={(e) => upd(i, "monthlyLimit", e.target.value)} placeholder="∞" className="w-24 rounded-lg border border-slate-200 px-2.5 py-1.5 focus:border-brand-500 focus:outline-none" /></td>
                      <td className="px-4 py-2"><input value={num(t.overPackOps)} onChange={(e) => upd(i, "overPackOps", e.target.value)} placeholder="—" className="w-24 rounded-lg border border-slate-200 px-2.5 py-1.5 focus:border-brand-500 focus:outline-none" /></td>
                      <td className="px-4 py-2"><input value={num(t.overPackPrice)} onChange={(e) => upd(i, "overPackPrice", e.target.value)} placeholder="—" className="w-28 rounded-lg border border-slate-200 px-2.5 py-1.5 focus:border-brand-500 focus:outline-none" /></td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => setTariffs((r) => r!.filter((_, idx) => idx !== i))} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
              <span className="text-[12.5px] text-slate-400">Пустой лимит = безлимит. «Операция» — выполненная задача клиента за календарный месяц.</span>
              <button onClick={saveTariffsNow} disabled={savingTariffs} className="rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700 disabled:opacity-50">
                {savingTariffs ? "Сохранение…" : "Сохранить"}
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Календарь: платёжные/налоговые подсказки — реальные;
   типы событий, интервалы и периодичность — жёстко зашиты в код (цвета,
   иконки, фильтры и маппинг на бэкенд), поэтому оставлены только для
   просмотра, а не свободного редактирования, чтобы не сломать сопоставление. ---------------- */
function CalendarDicts() {
  const [dicts, setDicts] = useState<Dicts | null>(null);
  useEffect(() => { fetchDicts().then(setDicts).catch(() => setDicts(null)); }, []);
  if (!dicts) return <Card><div className="p-8 text-center text-sm text-slate-400">Загрузка…</div></Card>;

  const saveField = (key: keyof Dicts) => async (list: string[]) => {
    const next = { ...dicts, [key]: list };
    const r = await saveDicts(next);
    if (!r.ok) throw new Error(r.error);
    setDicts(next);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <EditableListCard
          title="Категории платежей"
          hint="Подсказки при создании напоминания-платежа в календаре — реально влияют на форму."
          items={dicts.paymentCategories} placeholder="Новая категория" onSave={saveField("paymentCategories")} />
        <EditableListCard
          title="Категории налогов/отчётов"
          hint="Подсказки при создании напоминания-налога в календаре — реально влияют на форму."
          items={dicts.taxCategories} placeholder="Новая категория" onSave={saveField("taxCategories")} />
      </div>

      <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
        <Card>
          <CardHeader title="Типы событий календаря" />
          <div className="divide-y divide-slate-100">
            {dicts.calendarEventTypes.map((t) => <div key={t} className="px-5 py-3 text-[13.5px] font-medium">{t}</div>)}
          </div>
          <p className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-400">Системные — у каждого свой цвет/иконка/фильтр в коде календаря.</p>
        </Card>
        <Card>
          <CardHeader title="Интервалы напоминаний" />
          <div className="divide-y divide-slate-100">
            {dicts.reminderIntervals.map((t) => <div key={t} className="px-5 py-3 text-[13.5px] font-medium">{t}</div>)}
          </div>
          <p className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-400">Системные — каждый жёстко привязан к числу дней в форме напоминания.</p>
        </Card>
        <Card>
          <CardHeader title="Периодичность повторов" />
          <div className="divide-y divide-slate-100">
            {dicts.repeatPeriods.map((t) => <div key={t} className="px-5 py-3 text-[13.5px] font-medium">{t}</div>)}
          </div>
          <p className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-400">Системные — соответствуют фиксированным значениям на бэкенде.</p>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- 1С: синканные подразделения (только чтение) ---------------- */
function OneCDicts() {
  const [rows, setRows] = useState<DeptSummaryRow[] | null>(null);
  useEffect(() => { fetch1cDeptSummary().then(setRows).catch(() => setRows([])); }, []);

  return (
    <Card>
      <CardHeader title="Подразделения организаций (из 1С)" action={
        <Link to="/integrations/1c" className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] font-medium hover:bg-slate-50">
          <ExternalLink className="size-3.5" /> Синк в разделе «1С»
        </Link>
      } />
      {!rows ? (
        <div className="p-8 text-center text-sm text-slate-400">Загрузка…</div>
      ) : rows.length ? (
        <div className="divide-y divide-slate-100">
          {rows.map((b) => (
            <div key={b.code} className="px-5 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13.5px] font-medium">{b.name}</span>
                <Badge tone={b.count ? "green" : "gray"}>{b.count} подразделений</Badge>
              </div>
              {!!b.items.length && <p className="mt-1 truncate text-xs text-slate-400">{b.items.join(", ")}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="px-5 py-8 text-center text-sm text-slate-400">Базы не найдены</p>
      )}
      <p className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-400">Данные приходят из 1С синком (ночной крон + кнопка «Синк всего из 1С») — редактируются в самой 1С, здесь только просмотр.</p>
    </Card>
  );
}

export default function Dictionaries() {
  const [cat, setCat] = useState<CatId>("tasks");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><BookOpen className="size-6 text-brand-600" />Справочники</h1>
        <p className="mt-0.5 text-sm text-slate-500">Все настраиваемые перечни CRM — в одном месте, по категориям</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 [scrollbar-width:none]">
        {CATS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setCat(id)}
            className={`-mb-px flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-3.5 py-2.5 text-[13.5px] font-medium whitespace-nowrap transition ${cat === id ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
            <Icon className="size-4" />{label}
          </button>
        ))}
      </div>

      {cat === "tasks" && <TasksDicts />}
      {cat === "clients" && <ClientsDicts />}
      {cat === "calendar" && <CalendarDicts />}
      {cat === "onec" && <OneCDicts />}
    </div>
  );
}
