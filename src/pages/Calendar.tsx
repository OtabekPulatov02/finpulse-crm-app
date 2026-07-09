import { useMemo, useState } from "react";
import { AlarmClockPlus, ChevronLeft, ChevronRight, CreditCard, ListPlus, ListTodo, Plus, Receipt, Send } from "lucide-react";
import { Badge, Card, CardHeader, Modal, toast } from "../components/ui";

type EvType = "tax" | "pay" | "task";
interface Ev { date: Date; type: EvType; title: string; company: string; repeat: string; remind: number; done?: boolean }

const MONTHS = ["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"];
const MONTHS_G = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const DOW = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const DOW_FULL = ["понедельник","вторник","среда","четверг","пятница","суббота","воскресенье"];

function seed(): Ev[] {
  const y = new Date().getFullYear();
  const out: Ev[] = [];
  const ev = (m: number, d: number, type: EvType, title: string, company: string, repeat: string, remind: number) =>
    out.push({ date: new Date(y, m, d), type, title, company, repeat, remind });
  for (let m = 5; m <= 9; m++) {
    ev(m, 12, "tax", "НДФЛ и соцвзносы с зарплаты", "Все клиенты", "Ежемесячно", 3);
    ev(m, 20, "tax", "Декларация и оплата НДС", "Клиенты на ОСНО/НДС", "Ежемесячно", 3);
    ev(m, 25, "tax", "Авансовый платёж по УСН", "Клиенты на УСН", "Ежеквартально", 7);
    ev(m, 5, "pay", "Аренда офиса — 12 000 000 сум", "ООО «ТехноСфера»", "Ежемесячно", 3);
    ev(m, 10, "pay", "Интернет и связь — 850 000 сум", "ООО «ТехноСфера»", "Ежемесячно", 1);
    ev(m, 15, "pay", "Аренда склада — 26 000 000 сум", "ООО «Логистик Групп»", "Ежемесячно", 3);
  }
  ev(6, 27, "tax", "6-НДФЛ за полугодие", "Все клиенты", "Ежеквартально", 7);
  ev(7, 1, "pay", "Страховка автопарка — 34 000 000 сум", "ООО «Логистик Групп»", "Ежегодно", 7);
  ev(6, 10, "task", "Ответ на требование ИФНС № 14-08/2214", "ООО «СтройГарант»", "", 1);
  ev(6, 25, "task", "Декларация по НДС за II квартал (№ 1247)", "ООО «ТехноСфера»", "", 3);
  return out;
}

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

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const fmt = (d: Date) => `${d.getDate()} ${MONTHS_G[d.getMonth()]}`;

export default function Calendar() {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [events, setEvents] = useState<Ev[]>(seed);
  const [cur, setCur] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [filter, setFilter] = useState<"all" | EvType>("all");
  const [day, setDay] = useState<Date | null>(null);
  const [showNew, setShowNew] = useState(false);

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
    .filter((e) => { const dd = daysDiff(e.date); return dd >= 0 && dd <= 14 && visible(e) && !e.done; })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 7);

  // Форма напоминания
  const [nType, setNType] = useState<"tax" | "pay">("pay");
  const [nTitle, setNTitle] = useState("");
  const [nCompany, setNCompany] = useState("Все клиенты");
  const [nDate, setNDate] = useState(() => {
    const d = new Date(today); d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [nRepeat, setNRepeat] = useState("Ежемесячно");
  const [nRemind, setNRemind] = useState("за 3 дня");
  const suggests = nType === "pay"
    ? ["Аренда офиса", "Интернет и связь", "Коммунальные", "Лизинг", "Страховка"]
    : ["Оплата НДС", "Аванс по УСН", "НДФЛ и соцвзносы", "Отчёт в статистику"];

  const createReminder = () => {
    if (!nTitle.trim()) { toast("Укажите название напоминания"); return; }
    const d = new Date(nDate + "T00:00:00");
    setEvents((s) => [...s, {
      date: d, type: nType, title: nTitle.trim(), company: nCompany,
      repeat: nRepeat === "Однократно" ? "" : nRepeat,
      remind: nRemind === "в день события" ? 0 : nRemind === "за 1 день" ? 1 : nRemind === "за 3 дня" ? 3 : 7,
    }]);
    setCur(new Date(d.getFullYear(), d.getMonth(), 1));
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
                  {evs.slice(0, 3).map((e, j) => (
                    <span key={j} className={`truncate rounded border-l-2 px-1.5 py-px text-[10.5px] font-medium ${pill[e.type]} ${e.done ? "line-through opacity-50" : ""}`}>{e.title}</span>
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
            {upcoming.map((e, i) => {
              const dd = daysDiff(e.date);
              const Icon = typeIcon[e.type];
              return (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${typeIconBg[e.type]}`}><Icon className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-[13px] leading-snug font-semibold">{e.title}</div>
                    <div className="mt-0.5 text-[11.5px] text-slate-400">{e.company} · {fmt(e.date)}{e.repeat && ` · 🔁 ${e.repeat.toLowerCase()}`}</div>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-cyan-600"><Send className="size-3" />бот уведомит за {e.remind} дн.</div>
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
            {eventsOn(day).map((e, i) => {
              const Icon = typeIcon[e.type];
              return (
                <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${typeIconBg[e.type]}`}><Icon className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-[13.5px] font-semibold ${e.done ? "line-through opacity-50" : ""}`}>{e.title}</div>
                    <div className="text-xs text-slate-400">{typeName[e.type]} · {e.company}{e.repeat && ` · 🔁 ${e.repeat.toLowerCase()}`}</div>
                  </div>
                  {e.type !== "task" && !e.done && (
                    <div className="flex shrink-0 gap-1.5">
                      <button onClick={() => toast(`Задача создана: «${e.title}»`)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50"><ListPlus className="size-3.5" />В задачи</button>
                      <button onClick={() => { setEvents((s) => s.map((x) => (x === e ? { ...x, done: true } : x))); toast("Отмечено выполненным"); }} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50">Готово</button>
                    </div>
                  )}
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
          <button onClick={createReminder} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Создать</button>
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
            <input value={nTitle} onChange={(e) => setNTitle(e.target.value)} placeholder="Аренда офиса — 12 000 000 сум" className={inp} />
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
                {["Все клиенты", "ООО «ТехноСфера»", "ООО «СтройГарант»", "ООО «Логистик Групп»", "ООО «МедФарм»"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Дата <span className="text-red-500">*</span></label>
              <input type="date" value={nDate} onChange={(e) => setNDate(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Повтор</label>
              <select value={nRepeat} onChange={(e) => setNRepeat(e.target.value)} className={inp}>
                {["Однократно", "Ежедневно", "Еженедельно", "Ежемесячно", "Ежеквартально", "Ежегодно"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Напомнить</label>
              <select value={nRemind} onChange={(e) => setNRemind(e.target.value)} className={inp}>
                {["в день события", "за 1 день", "за 3 дня", "за неделю"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <p className="flex items-center gap-2 text-xs text-slate-400"><Send className="size-3.5" />Бот напомнит в Telegram-группе и создаст задачу при приближении срока.</p>
        </div>
      </Modal>
    </div>
  );
}
