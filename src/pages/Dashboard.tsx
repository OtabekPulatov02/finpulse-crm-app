import {
  AlertCircle, ArrowRight, ArrowUpRight, Building2, Check, CheckCircle2,
  ListTodo, Paperclip, Send, UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, Badge, Card, CardHeader, toast } from "../components/ui";
import { employees, priorityTone } from "../data/demo";
import { isLiveTask, setTaskStatus, useTasks } from "../store/tasks";

const kpi = [
  { label: "Клиенты", value: "48", trend: "+3 за месяц", icon: Building2, tone: "text-brand-600 bg-brand-50" },
  { label: "Активные задачи", value: "37", trend: "+5 за неделю", icon: ListTodo, tone: "text-violet-600 bg-violet-50" },
  { label: "Выполненные", value: "124", trend: "+12% к июню", icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
  { label: "Просроченные", value: "5", trend: "−2 за неделю", icon: AlertCircle, tone: "text-red-600 bg-red-50" },
];

const tgRequests = [
  { from: "ООО «ТехноСфера»", time: "14:02", msg: "Пришло требование из налоговой по НДС, нужна помощь до пятницы…" },
  { from: "ООО «МедФарм»", time: "12:47", msg: "Добрый день! Нужен акт сверки с поставщиком «ФармОпт» за первое полугодие." },
  { from: "ООО «Логистик Групп»", time: "09:15", msg: "Подскажите, какие документы нужны для приёма нового сотрудника с 15 июля?" },
];

const activity = [
  { icon: Check, tone: "bg-emerald-50 text-emerald-600", text: <><b>Дмитрий Орлов</b> выполнил задачу «6-НДФЛ за полугодие»</>, time: "сегодня, 10:12" },
  { icon: Send, tone: "bg-brand-50 text-brand-600", text: <>Из <b>Telegram</b> создана задача для <b>ООО «ТехноСфера»</b></>, time: "сегодня, 09:40" },
  { icon: UserPlus, tone: "bg-violet-50 text-violet-600", text: <><b>Елена Крылова</b> назначена ответственной за <b>ООО «АгроТрейд»</b></>, time: "вчера, 17:03" },
  { icon: Paperclip, tone: "bg-slate-100 text-slate-500", text: <><b>Анна Смирнова</b> прикрепила файл «ведомость_июнь.xlsx»</>, time: "вчера, 14:11" },
];

const donut = [
  { label: "В работе", n: 24, color: "#2563eb" },
  { label: "Новые", n: 14, color: "#8b5cf6" },
  { label: "Выполнены", n: 19, color: "#10b981" },
  { label: "Отменены", n: 5, color: "#94a3b8" },
];
const donutTotal = donut.reduce((s, d) => s + d.n, 0);

function Donut() {
  const r = 54, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg viewBox="0 0 140 140" className="size-36 -rotate-90">
      {donut.map((d) => {
        const len = (d.n / donutTotal) * c;
        const el = (
          <circle key={d.label} cx="70" cy="70" r={r} fill="none" stroke={d.color} strokeWidth="16"
            strokeDasharray={`${len - 2} ${c - len + 2}`} strokeDashoffset={-acc} />
        );
        acc += len;
        return el;
      })}
    </svg>
  );
}

export default function Dashboard() {
  const tasks = useTasks();
  const today = tasks.filter((t) => t.status !== "Выполнена" && t.status !== "Архив").slice(0, 5);
  const liveReqs = tasks
    .filter((t) => t.fromBot && isLiveTask(t.id) && t.status !== "Архив")
    .slice(0, 3)
    .map((t) => ({ from: t.client, time: t.created ?? "", msg: t.description ?? t.title, live: true }));
  const requests = liveReqs.length ? liveReqs : tgRequests.map((r) => ({ ...r, live: false }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Дашборд</h1>
        <p className="mt-0.5 text-sm text-slate-500">Обзор работы бухгалтерии</p>
      </div>

      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {kpi.map(({ label, value, trend, icon: Icon, tone }) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between">
              <span className="text-[13px] font-medium text-slate-500">{label}</span>
              <span className={`flex size-9 items-center justify-center rounded-lg ${tone}`}>
                <Icon className="size-[18px]" />
              </span>
            </div>
            <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
              <ArrowUpRight className="size-3.5 text-emerald-500" />
              {trend}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4 max-xl:grid-cols-1">
        <div className="col-span-3 space-y-4 max-xl:col-span-1">
          <Card>
            <CardHeader title="Задачи на сегодня" action={
              <Link to="/tasks" className="flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">
                Все задачи <ArrowRight className="size-3.5" />
              </Link>
            } />
            <div className="divide-y divide-slate-100">
              {today.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                  <input type="checkbox" className="size-4 accent-brand-600"
                    onChange={() => { setTaskStatus(t.id, "Выполнена"); toast("Задача отмечена выполненной"); }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium">{t.title}</div>
                    <div className="text-xs text-slate-400">{t.client} · {t.assignee}</div>
                  </div>
                  {t.fromBot && <Send className="size-3.5 shrink-0 text-cyan-500" />}
                  <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
                  <span className="text-xs whitespace-nowrap text-slate-400">до {t.due}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Новые обращения из Telegram" action={
              liveReqs.length ? <span className="flex items-center gap-1.5 text-xs text-emerald-600"><span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />живые данные бота</span> : undefined
            } />
            <div className="divide-y divide-slate-100">
              {requests.map((r) => (
                <div key={r.from} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={r.from.replace(/^(ООО|АО|ИП|MCHJ)\s*«?/, "")} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[13.5px] font-semibold">{r.from}</span>
                      <span className="shrink-0 text-[11px] text-slate-400">{r.time}</span>
                    </div>
                    <div className="truncate text-xs text-slate-400">{r.msg}</div>
                  </div>
                  <Link to="/tasks" className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">
                    Создать задачу
                  </Link>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Загрузка сотрудников" action={
              <Link to="/employees" className="flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">
                Сотрудники <ArrowRight className="size-3.5" />
              </Link>
            } />
            <div className="space-y-4 p-5">
              {employees.map(({ name, load }) => (
                <div key={name} className="flex items-center gap-3">
                  <Avatar name={name} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex justify-between text-[13px]">
                      <span className="font-medium">{name}</span>
                      <span className="font-semibold text-slate-500">{load}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${load > 85 ? "bg-red-500" : load > 70 ? "bg-amber-500" : "bg-brand-500"}`}
                        style={{ width: `${load}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="col-span-2 space-y-4 max-xl:col-span-1">
          <Card>
            <CardHeader title="Статусы задач" action={<Badge tone="gray">июль</Badge>} />
            <div className="flex items-center gap-6 p-5">
              <div className="relative">
                <Donut />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{donutTotal}</span>
                  <span className="text-[10px] text-slate-400">всего задач</span>
                </div>
              </div>
              <ul className="flex-1 space-y-2.5 text-[13px]">
                {donut.map((d) => (
                  <li key={d.label} className="flex items-center gap-2">
                    <span className="size-2.5 rounded-sm" style={{ background: d.color }} />
                    {d.label}
                    <span className="ml-auto font-semibold text-slate-500">{d.n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card>
            <CardHeader title="Последняя активность" />
            <div className="space-y-4 p-5">
              {activity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${a.tone}`}>
                    <a.icon className="size-3.5" />
                  </span>
                  <div>
                    <div className="text-[13px] leading-snug [&_b]:font-semibold">{a.text}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
