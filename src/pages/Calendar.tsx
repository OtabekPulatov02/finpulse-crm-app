import { useEffect, useMemo, useState } from "react";
import { AlarmClockPlus, ChevronLeft, ChevronRight, CreditCard, ExternalLink, ListTodo, Plus, Receipt, Send, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge, Card, CardHeader, ConfirmModal, Modal, toast } from "../components/ui";
import { useTasks } from "../store/tasks";
import { hydrateClients, useClients } from "../store/clients";
import { createCalendarEvent, editCalendarEvent, hydrateCalendarEvents, removeCalendarEvent, useCalendarEvents } from "../store/calendarEvents";
import type { CalendarEventEntry } from "../api";
import { formatSumsInText } from "../lib/amount";

type EvType = "tax" | "pay" | "task";
interface Ev {
  key: string; date: Date; type: EvType; title: string; company: string;
  repeat: string; remindDays: number | null; id?: string; taskNum?: number;
  status?: CalendarEventEntry["status"];
}

const MONTHS = ["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"];
const MONTHS_G = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const DOW = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const DOW_FULL = ["понедельник","вторник","среда","четверг","пятница","суббота","воскресенье"];

const pill: Record<EvType, string> = {
  tax: "bg-violet-50 text-violet-600 border-l-violet-500",
  pay: "bg-brand-50 text-brand-600 border-l-brand-500",
  task: "bg-amber-50 text-amber-600 border-l-amber-500",
};
const typeIcon: Record<EvType, typeof Receipt> = { tax: Receipt, pay: CreditCard, task: ListTodo };
const typeIconBg: Record<EvType, string> = {
  tax: "bg-violet-50 text-violet-600", pay: "bg-brand-50 text-brand-600", task: "bg-amber-50 text-amber-600",
};
const typeName: Record<EvType, string> = { tax: "Налог / отчёт", pay: "Платёж", task: "Задача" };

const REPEAT_LABEL: Record<CalendarEventEntry["repeat"], string> = {
  once: "Однократно", monthly: "Ежемесячно", quarterly: "Ежеквартально", yearly: "Ежегодно",
};
const REPEAT_VALUE: Record<string, CalendarEventEntry["repeat"]> = {
  "Однократно": "once", "Ежемесячно": "monthly", "Ежеквартально": "quarterly", "Ежегодно": "yearly",
};
const REMIND_VALUE: Record<string, number> = {
  "в день события": 0, "за 1 день": 1, "за 3 дня": 3, "за неделю": 7,
};
const CE_STATUS_LABEL: Record<CalendarEventEntry["status"], string> = {
  new: "Новая", in_progress: "В работе", done: "Выполнено",
};
const CE_STATUS_TONE: Record<CalendarEventEntry["status"], string> = {
  new: "bg-violet-50 text-violet-600 border-violet-200",
  in_progress: "bg-brand-50 text-brand-600 border-brand-200",
  done: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const fmt = (d: Date) => `${d.getDate()} ${MONTHS_G[d.getMonth()]}`;
const parseISODate = (s: string) => new Date(s + "T00:00:00");

export default function Calendar() {
  const navigate = useNavigate();
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  const tasks = useTasks();
  const clients = useClients();
  const calendarEvents = useCalendarEvents();
  useEffect(() => { void hydrateClients(); void hydrateCalendarEvents(); }, []);

  const events: Ev[] = useMemo(() => {
    const fromTasks: Ev[] = tasks
      .filter((t) => t.dueDate && t.status !== "Выполнена")
      .map((t) => ({
        key: "task:" + t.id, date: parseISODate(t.dueDate!), type: "task" as const,
        title: t.title, company: t.client, repeat: "", remindDays: null, taskNum: t.id,
      }));
    const fromEvents: Ev[] = calendarEvents
      .filter((e) => e.active)
      .map((e) => ({
        key: "ce:" + e.id, date: parseISODate(e.date), type: e.type,
        title: e.title, company: e.company || "Все клиенты",
        repeat: REPEAT_LABEL[e.repeat], remindDays: e.remindDays, id: e.id,
        status: e.status,
      }));
    return [...fromTasks, ...fromEvents];
  }, [tasks, calendarEvents]);

  const [cur, setCur] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [filter, setFilter] = useState<"all" | EvType>("all");
  const [day, setDay] = useState<Date | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [deleteEv, setDeleteEv] = useState<Ev | null>(null);

  const visible = (e: Ev) => filter === "all" || e.type === filter;
  const eventsOn = (d: Date) => events.filter((e) => sameDay(e.date, d) && visible(e));
  const daysDiff = (d: Date) => Math.round((d.getTime() - today.getTime()) / 86400000);

  const cells = useMemo(() => {
    const first = new Date(cur.getFullYear(), cur.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i); return d;
    });
  }, [cur]);

  const upcoming = events
    .filter((e) => { const dd = daysDiff(e.date); return dd >= 0 && dd <= 14 && visible(e); })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 7);

  /* Форма напоминания */
  const [nType, setNType] = useState<"tax" | "pay">("pay");
  const [nTitle, setNTitle] = useState("");
  const [nCompany, setNCompany] = useState("Все клиенты");
  const [nDate, setNDate] = useState(() => {
    const d = new Date(today); d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [nRepeat, setNRepeat] = useState("Ежемесячно");
  const [nRemind, setNRemind] = useState("за 3 дня");
  const [saving, setSaving] = useState(false);
  const suggests = nType === "pay"
    ? ["Аренда офиса", "Интернет и связь", "Коммунальные", "Лизинг", "Страховка"]
    : ["Оплата НДС", "Аванс по УСН", "НДФЛ и соцвзносы", "Отчёт в статистику"];
  const companyOptions = ["Все клиенты", ...clients.map((c) => c.company)];

  const createReminder = async () => {
    if (!nTitle.trim()) { toast("Укажите название напоминания"); return; }
    setSaving(true);
    const r = await createCalendarEvent({
      type: nType, title: nTitle.trim(),
      company: nCompany === "Все клиенты" ? null : nCompany,
      date: nDate, repeat: REPEAT_VALUE[nRepeat], remindDays: REMIND_VALUE[nRemind],
    });
    setSaving(false);
    if (!r.ok) { toast(r.error || "Не удалось создать напоминание"); return; }
    setCur(new Date(parseISODate(nDate).getFullYear(), parseISODate(nDate).getMonth(), 1));
    setShowNew(false); setNTitle("");
    toast(`Напоминание создано · бот напомнит ${nRemind}`);
  };

  const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Календарь</h1>
          <p className="mt-0.5 text-sm text-slate-500">Отчёты, налоги и платежи фирм — с напоминаниями от бота</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700">
          <AlarmClockPlus className="size-4" /> Напоминание
        </button>
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-4 max-xl:grid-cols-1">
        <Card>
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4">
            <button onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth() - 1, 1))} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50"><ChevronLeft className="size-4" /></button>
            <div className="min-w-32 text-center text-[15px] font-bold capitalize">{MONTHS[cur.getMonth()]} {cur.getFullYear()}</div>
            <button onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth() + 1, 1))} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50"><ChevronRight className="size-4" /></button>
            <button onClick={() => setCur(new Date(today.getFullYear(), today.getMonth(), 1))} className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:bg-slate-100">Сегодня</button>
            <div className="ml-auto flex flex-wrap gap-1.5">
              {([["all", "Все"], ["tax", "Налоги"], ["pay", "Платежи"], ["task", "Задачи"]] as const).map(([v, l]) => (
                <button key={v} onClick={() => setFilter(v)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${filter === v ? "border-brand-200 bg-brand-50 text-brand-600" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-7">
            {DOW.map((d, i) => (
              <div key={d} className={`border-b border-slate-200 py-2 text-center text-[11px] font-semibold tracking-wider uppercase ${i > 4 ? "text-red-400" : "text-slate-400"}`}>{d}</div>
            ))}
            {cells.map((d, i) => {
              const evs = eventsOn(d);
              const isToday = sameDay(d, today);
              const other = d.getMonth() !== cur.getMonth();
              return (
                <button key={i} onClick={() => setDay(d)}
                  className={`flex min-h-24 flex-col gap-0.5 border-r border-b border-slate-100 p-1.5 text-left transition hover:bg-slate-50 ${other ? "bg-slate-50/60 opacity-60" : ""}`}>
                  <span className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${isToday ? "bg-brand-600 text-white" : "text-slate-500"}`}>{d.getDate()}</span>
                  {evs.slice(0, 3).map((e) => (
                    <span key={e.key} className={`truncate rounded border-l-2 px-1.5 py-px text-[10.5px] font-medium ${pill[e.type]}`}>{e.title}</span>
                  ))}
                  {evs.length > 3 && <span className="px-1.5 text-[10px] text-slate-400">ещё {evs.length - 3}</span>}
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Ближайшие сроки" action={<Badge tone="red">14 дней</Badge>} />
          <div className="divide-y divide-slate-100">
            {upcoming.map((e) => {
              const dd = daysDiff(e.date);
              const Icon = typeIcon[e.type];
              return (
                <div key={e.key} className="flex items-start gap-3 px-4 py-3">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${typeIconBg[e.type]}`}><Icon className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-[13px] leading-snug font-semibold">{e.title}</div>
                    <div className="mt-0.5 text-[11.5px] text-slate-400">{e.company} · {fmt(e.date)}{e.repeat && ` · 🔁 ${e.repeat.toLowerCase()}`}</div>
                    {e.remindDays !== null && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-cyan-600"><Send className="size-3" />бот уведомит за {e.remindDays} дн.</div>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${dd === 0 ? "bg-red-50 text-red-600" : dd <= 3 ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
                    {dd === 0 ? "сегодня" : dd === 1 ? "завтра" : `через ${dd} дн.`}
                  </span>
                </div>
              );
            })}
            {!upcoming.length && <div className="p-8 text-center text-sm text-slate-400">В ближайшие две недели сроков нет</div>}
          </div>
        </Card>
      </div>

      {/* Модалка: события дня */}
      <Modal open={!!day} onClose={() => setDay(null)}
        title={day ? `${fmt(day)}, ${DOW_FULL[(day.getDay() + 6) % 7]}` : ""}
        footer={<button onClick={() => { setDay(null); if (day) setNDate(`${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`); setShowNew(true); }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
          <Plus className="size-4" /> Добавить на этот день
        </button>}>
        {day && (
          <div className="divide-y divide-slate-100">
            {eventsOn(day).map((e) => {
              const Icon = typeIcon[e.type];
              return (
                <div key={e.key} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${typeIconBg[e.type]}`}><Icon className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold">{e.title}</div>
                    <div className="text-xs text-slate-400">{typeName[e.type]} · {e.company}{e.repeat && ` · 🔁 ${e.repeat.toLowerCase()}`}</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {e.type === "task" ? (
                      <button onClick={() => { setDay(null); navigate(`/tasks?open=${e.taskNum}`); }}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50">
                        <ExternalLink className="size-3.5" />Открыть задачу
                      </button>
                    ) : (
                      <>
                        <select
                          value={e.status ?? "new"}
                          onChange={(ev2) => {
                            if (!e.id) return;
                            const status = ev2.target.value as CalendarEventEntry["status"];
                            void editCalendarEvent(e.id, { status }).then((r) => {
                              if (!r.ok) toast(r.error || "Не удалось изменить статус");
                            });
                          }}
                          className={`rounded-lg border px-2 py-1 text-[11px] font-medium ${CE_STATUS_TONE[e.status ?? "new"]}`}
                        >
                          {(Object.keys(CE_STATUS_LABEL) as CalendarEventEntry["status"][]).map((s) => (
                            <option key={s} value={s}>{CE_STATUS_LABEL[s]}</option>
                          ))}
                        </select>
                        <button onClick={() => setDeleteEv(e)}
                          className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                          <Trash2 className="size-3.5" />Удалить
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {!eventsOn(day).length && <div className="py-8 text-center text-sm text-slate-400">На этот день ничего нет</div>}
          </div>
        )}
      </Modal>

      {/* Модалка: новое напоминание */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Новое напоминание"
        footer={<>
          <button onClick={() => setShowNew(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50">Отмена</button>
          <button disabled={saving} onClick={createReminder} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
            {saving ? "Создаём…" : "Создать"}
          </button>
        </>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            {([["tax", "🧾", "Налог / отчёт"], ["pay", "💳", "Платёж фирмы"]] as const).map(([v, emoji, label]) => (
              <button key={v} onClick={() => setNType(v)}
                className={`flex items-center gap-2.5 rounded-xl border-2 p-3 text-left text-sm font-semibold transition ${nType === v ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"}`}>
                <span className="text-xl">{emoji}</span>{label}
              </button>
            ))}
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">Что напомнить <span className="text-red-500">*</span></label>
            <input value={nTitle} onChange={(e) => setNTitle(e.target.value)} onBlur={() => setNTitle((v) => formatSumsInText(v))} placeholder="Аренда офиса — 12 000 000 сум" className={inp} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {suggests.map((s) => (
                <button key={s} onClick={() => setNTitle(s)} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600">{s}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Компания</label>
              <select value={nCompany} onChange={(e) => setNCompany(e.target.value)} className={inp}>
                {companyOptions.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Дата <span className="text-red-500">*</span></label>
              <input type="date" value={nDate} onChange={(e) => setNDate(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Повтор</label>
              <select value={nRepeat} onChange={(e) => setNRepeat(e.target.value)} className={inp}>
                {Object.keys(REPEAT_VALUE).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Напомнить</label>
              <select value={nRemind} onChange={(e) => setNRemind(e.target.value)} className={inp}>
                {Object.keys(REMIND_VALUE).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <p className="flex items-center gap-2 text-xs text-slate-400"><Send className="size-3.5" />Бот напомнит в Telegram-группе при приближении срока.</p>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteEv} onClose={() => setDeleteEv(null)}
        title="Удалить напоминание?"
        text={deleteEv ? `«${deleteEv.title}» больше не будет напоминаться.` : ""}
        confirmLabel="Удалить"
        onConfirm={() => {
          if (!deleteEv?.id) return;
          const id = deleteEv.id;
          void removeCalendarEvent(id).then((r) => {
            if (r.ok) toast("Напоминание удалено"); else toast(r.error || "Не удалось удалить");
          });
          setDay(null);
        }}
      />
    </div>
  );
}
