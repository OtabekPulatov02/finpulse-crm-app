import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Bell, GitBranch, Pencil, Plus, ScrollText, Shield, Tags, UserPlus, Users } from "lucide-react";
import { Avatar, Badge, Card, CardHeader, Toggle, toast, type Tone } from "../components/ui";
import { fetchLogs } from "../api";
import { mapLog, type LogView } from "../lib/logs";
import { hydrateEmployees, useEmployees } from "../store/employees";
import { EDITABLE_STATUSES, PRIORITIES, priorityTone, statusTone } from "../data/demo";

const tabs = [
  { id: "users", label: "Пользователи", icon: Users },
  { id: "roles", label: "Роли", icon: Shield },
  { id: "statuses", label: "Статусы", icon: Tags },
  { id: "dicts", label: "Справочники", icon: BookOpen },
  { id: "rules", label: "Распределение", icon: GitBranch },
  { id: "notif", label: "Уведомления", icon: Bell },
  { id: "logs", label: "Логи системы", icon: ScrollText },
] as const;
type TabId = (typeof tabs)[number]["id"];

function DictCard({ title, items, placeholder }: { title: string; items: { label: string; badge?: Tone; note?: string }[]; placeholder: string }) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="divide-y divide-slate-100">
        {items.map((i) => (
          <div key={i.label} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="flex items-center gap-3">
              {i.badge ? <Badge tone={i.badge}>{i.label}</Badge> : <span className="text-[13.5px] font-medium">{i.label}</span>}
              {i.note && <span className="text-xs text-slate-400">{i.note}</span>}
            </div>
            <button onClick={() => toast("Редактирование справочника (демо)")} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="size-3.5" /></button>
          </div>
        ))}
        <div className="flex items-center gap-2 px-5 py-3">
          <input placeholder={placeholder} className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] focus:border-brand-500 focus:outline-none" />
          <button onClick={() => toast("Добавлено в справочник (демо)")} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"><Plus className="size-3.5" />Добавить</button>
        </div>
      </div>
    </Card>
  );
}


const ROLE_LABEL: Record<string, string> = { admin: "Администратор", accountant: "Бухгалтер" };
const ROLE_TONE: Record<string, Tone> = { admin: "purple", accountant: "blue" };

export default function Settings() {
  const [tab, setTab] = useState<TabId>("users");
  const [logFilter, setLogFilter] = useState<"all" | "tg" | "crm">("all");
  const [live, setLive] = useState<LogView[] | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const employees = useEmployees();
  useEffect(() => { void hydrateEmployees(); }, []);
  useEffect(() => {
    if (tab !== "logs" || live) return;
    setLogsLoading(true);
    Promise.all([fetchLogs("telegram"), fetchLogs("crm")])
      .then(([tg, crm]) => {
        const rows = [...tg.map((l) => mapLog(l, "tg")), ...crm.map((l) => mapLog(l, "crm"))]
          .sort((a, b) => ((a.ts ?? "") < (b.ts ?? "") ? 1 : -1));
        setLive(rows);
      })
      .catch(() => setLive([]))
      .finally(() => setLogsLoading(false));
  }, [tab, live]);
  const allLogs: LogView[] = live ?? [];
  const shownLogs = allLogs.filter((l) => logFilter === "all" || l.src === logFilter);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
        <p className="mt-0.5 text-sm text-slate-500">Пользователи, роли, справочники и логи</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 [scrollbar-width:none]">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`-mb-px flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-3.5 py-2.5 text-[13.5px] font-medium whitespace-nowrap transition ${tab === id ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
            <Icon className="size-4" />{label}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
            <span className="text-sm font-semibold">{employees.length} {employees.length === 1 ? "сотрудник" : "сотрудника"}</span>
            <Link to="/employees" className="flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-brand-700"><UserPlus className="size-4" />Управлять в разделе «Сотрудники»</Link>
          </div>
          {employees.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    <th className="px-5 py-3">Сотрудник</th><th className="px-4 py-3">Телефон (логин)</th><th className="px-4 py-3">Роль</th><th className="px-4 py-3">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 whitespace-nowrap"><span className="flex items-center gap-2.5 font-medium"><Avatar name={e.name} />{e.name}</span></td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">{e.phone ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge tone={ROLE_TONE[e.role] ?? "gray"}>{ROLE_LABEL[e.role] ?? e.role}</Badge></td>
                      <td className="px-4 py-3 whitespace-nowrap">{e.active ? <Badge tone="green">Активен</Badge> : <Badge tone="gray">Отключён</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-slate-400">Сотрудники ещё не добавлены — создайте первого в разделе «Сотрудники».</p>
          )}
        </Card>
      )}

      {tab === "roles" && (
        <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
          {[
            { name: "Администратор", desc: "Полный доступ: сотрудники, все клиенты и задачи, настройки, логи.", tone: "purple" as Tone },
            { name: "Бухгалтер", desc: "Свои клиенты и задачи, назначенные в CRM.", tone: "blue" as Tone },
            { name: "Клиент", desc: "Доступ только к своим задачам через бота/личный кабинет.", tone: "cyan" as Tone },
            { name: "Гость", desc: "Демонстрационный доступ без реальных данных.", tone: "gray" as Tone },
          ].map((r) => (
            <Card key={r.name} className="p-5">
              <Badge tone={r.tone}>{r.name}</Badge>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-500">{r.desc}</p>
            </Card>
          ))}
        </div>
      )}

      {tab === "statuses" && (
        <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
          <DictCard title="Статусы задач" placeholder="Новый статус" items={[
            ...EDITABLE_STATUSES.map((s) => ({ label: s, badge: statusTone[s] })),
            { label: "Архив", badge: "gray" as Tone, note: "авто, через 24ч после выполнения" },
          ]} />
          <DictCard title="Приоритеты" placeholder="Новый приоритет" items={
            PRIORITIES.map((p) => ({ label: p, badge: priorityTone[p] }))
          } />
        </div>
      )}

      {tab === "dicts" && (
        <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
          <DictCard title="Типы событий календаря" placeholder="Новый тип" items={[
            { label: "Налоги и отчёты", badge: "purple", note: "срок в госорганы" },
            { label: "Платежи фирм", badge: "blue", note: "регулярные оплаты" },
            { label: "Задачи", badge: "yellow", note: "системный" },
          ]} />
          <DictCard title="Категории платежей" placeholder="Новая категория" items={[
            { label: "Аренда" }, { label: "Интернет и связь" }, { label: "Коммунальные услуги" }, { label: "Лизинг" }, { label: "Страховка" },
          ]} />
          <DictCard title="Интервалы напоминаний" placeholder="Например: за 2 недели" items={[
            { label: "В день события" }, { label: "За 1 день" }, { label: "За 3 дня", note: "по умолчанию" }, { label: "За неделю" },
          ]} />
          <DictCard title="Периодичность повторов" placeholder="Например: каждые 2 недели" items={[
            { label: "Однократно", note: "системный" }, { label: "Ежедневно" }, { label: "Ежемесячно", note: "по умолчанию" }, { label: "Ежеквартально" }, { label: "Ежегодно" },
          ]} />
        </div>
      )}

      {tab === "rules" && (
        <Card>
          <CardHeader title="Правила автораспределения" action={<button className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"><Plus className="size-3.5" />Правило</button>} />
          <div className="divide-y divide-slate-100">
            {[
              { n: 1, title: "Обращения из Telegram → ответственный бухгалтер", desc: "Источник: Telegram · Приоритет: Средний · Срок: 2 рабочих дня", on: true },
              { n: 2, title: "Задачи без исполнителя → наименее загруженный", desc: "Источник: любой · учитывается текущая загрузка", on: true },
              { n: 3, title: "Требования госорганов → налоговый консультант", desc: "Ключевые слова: «требование», «проверка» · Критический · 1 день", on: true },
              { n: 4, title: "Зарплатные задачи → бухгалтер по зарплате", desc: "Ключевые слова: «зарплата», «отпускные» · отключено", on: false },
            ].map((r) => (
              <div key={r.n} className="flex items-center gap-4 px-5 py-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-600">{r.n}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium">{r.title}</div>
                  <div className="text-xs text-slate-400">{r.desc}</div>
                </div>
                <Toggle defaultChecked={r.on} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "notif" && (
        <Card className="divide-y divide-slate-100">
          {[
            ["Новая задача назначена мне", "в системе и в Telegram", true],
            ["Обращение клиента из Telegram", "ответственному бухгалтеру", true],
            ["Приближается дедлайн", "за 24 часа до срока", true],
            ["Задача просрочена", "исполнителю и руководителю", true],
            ["Еженедельная сводка", "по понедельникам в 09:00", false],
          ].map(([title, desc, on]) => (
            <div key={title as string} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <div className="text-[13.5px] font-medium">{title as string}</div>
                <div className="text-xs text-slate-400">{desc as string}</div>
              </div>
              <Toggle defaultChecked={on as boolean} />
            </div>
          ))}
        </Card>
      )}

      {tab === "logs" && (
        <Card>
          <div className="flex items-center gap-2 border-b border-slate-200 p-4">
            {([["all", "Все"], ["tg", "Telegram"], ["crm", "CRM"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setLogFilter(v)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${logFilter === v ? "border-brand-200 bg-brand-50 text-brand-600" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                {l}
              </button>
            ))}
            <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
              {allLogs.length > 0 && <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />}
              {logsLoading ? "загрузка…" : allLogs.length ? "живые данные · хранятся последние 500" : "записей пока нет"}
            </span>
          </div>
          {shownLogs.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    <th className="px-4 py-3">Время</th><th className="px-4 py-3">Источник</th><th className="px-4 py-3">Событие</th>
                    <th className="px-4 py-3">Кто</th><th className="px-4 py-3">Исполнитель</th><th className="px-4 py-3">Детали</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shownLogs.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 whitespace-nowrap text-slate-400">{l.time}</td>
                      <td className="px-4 py-2.5"><Badge tone={l.src === "tg" ? "cyan" : "purple"}>{l.src === "tg" ? "Telegram" : "CRM"}</Badge></td>
                      <td className="px-4 py-2.5 font-medium whitespace-nowrap">{l.event}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{l.who}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{l.assignee}</td>
                      <td className="px-4 py-2.5 text-slate-500">{l.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              {logsLoading ? "Загружаем журнал…" : "Событий пока нет — они появятся здесь по мере работы с ботом и CRM."}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
