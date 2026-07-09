import { useEffect, useMemo } from "react";
import { AlertCircle, Building2, CheckCircle2, Download, FilePlus2 } from "lucide-react";
import { Avatar, Badge, Card, CardHeader, toast } from "../components/ui";
import { useClients } from "../store/clients";
import { hydrateEmployees, useEmployees } from "../store/employees";
import { displayStatus, isOverdue, useTasks } from "../store/tasks";

const statusColor: Record<string, string> = {
  "Новая": "bg-violet-500", "В работе": "bg-brand-500", "Выполнена": "bg-emerald-500", "Архив": "bg-slate-400",
};

export default function Analytics() {
  useEffect(() => { void hydrateEmployees(); }, []);
  const clients = useClients();
  const tasks = useTasks();
  const employees = useEmployees();

  const newTasks = tasks.filter((t) => t.status === "Новая").length;
  const doneTasks = tasks.filter((t) => t.status === "Выполнена").length;
  const overdueTasks = tasks.filter(isOverdue).length;

  const kpi = [
    { label: "Клиенты", value: String(clients.length), icon: Building2, tone: "text-brand-600 bg-brand-50" },
    { label: "Новые задачи", value: String(newTasks), icon: FilePlus2, tone: "text-violet-600 bg-violet-50" },
    { label: "Выполнено", value: String(doneTasks), icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
    { label: "Просрочено", value: String(overdueTasks), icon: AlertCircle, tone: "text-red-600 bg-red-50" },
  ];

  const perf = useMemo(() => employees
    .filter((e) => e.active)
    .map((e) => {
      const own = tasks.filter((t) => t.assignee === e.name);
      const done = own.filter((t) => t.status === "Выполнена");
      const overdue = own.filter(isOverdue).length;
      const ontime = done.length ? Math.round(((done.length - overdue) / done.length) * 100) : 0;
      return { name: e.name, done: done.length, overdue, ontime, total: own.length };
    })
    .filter((p) => p.total > 0)
    .sort((a, b) => b.done - a.done), [employees, tasks]);

  const statusBreakdown = useMemo(() => {
    const buckets = ["Новая", "В работе", "Выполнена", "Архив"];
    const counts = buckets.map((label) => ({ label, n: tasks.filter((t) => displayStatus(t) === label).length }));
    const max = Math.max(1, ...counts.map((c) => c.n));
    return counts.map((c) => ({ ...c, w: Math.round((c.n / max) * 100), c: statusColor[c.label] }));
  }, [tasks]);

  const fromBotCount = tasks.filter((t) => t.status === "Новая" && t.fromBot).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Аналитика</h1>
          <p className="mt-0.5 text-sm text-slate-500">Показатели на {new Date().toLocaleDateString("ru-RU")}</p>
        </div>
        <button onClick={() => toast("Экспорт отчёта скоро будет доступен")} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50">
          <Download className="size-4" /> Экспорт отчёта
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {kpi.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="flex items-center gap-4 p-5">
            <span className={`flex size-11 items-center justify-center rounded-xl ${tone}`}><Icon className="size-5" /></span>
            <div>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-[13px] text-slate-500">{label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4 max-xl:grid-cols-1">
        <Card className="col-span-3 max-xl:col-span-1">
          <CardHeader title="Производительность сотрудников" />
          {perf.length ? (
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  <th className="px-5 py-3">Сотрудник</th>
                  <th className="px-4 py-3">Выполнено</th>
                  <th className="px-4 py-3">Просрочено</th>
                  <th className="px-4 py-3">В срок</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {perf.map((p) => (
                  <tr key={p.name} className="hover:bg-slate-50">
                    <td className="px-5 py-3"><span className="flex items-center gap-2.5 font-medium"><Avatar name={p.name} />{p.name}</span></td>
                    <td className="px-4 py-3 font-semibold">{p.done}</td>
                    <td className="px-4 py-3">{p.overdue}</td>
                    <td className="px-4 py-3">{p.done ? <Badge tone={p.ontime >= 90 ? "green" : "yellow"}>{p.ontime}%</Badge> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-slate-400">Пока нет задач, назначенных сотрудникам.</p>
          )}
        </Card>

        <Card className="col-span-2 max-xl:col-span-1">
          <CardHeader title="Статистика по статусам" />
          <div className="space-y-3.5 p-5">
            {statusBreakdown.map((s) => (
              <div key={s.label} className="grid grid-cols-[90px_1fr_32px] items-center gap-3 text-[13px]">
                <span className="text-slate-500">{s.label}</span>
                <div className="h-5 overflow-hidden rounded bg-slate-100">
                  <div className={`h-full rounded ${s.c}`} style={{ width: `${s.w}%` }} />
                </div>
                <span className="text-right font-semibold">{s.n}</span>
              </div>
            ))}
            {tasks.length > 0 && newTasks > 0 && (
              <p className="pt-2 text-xs text-slate-400">{fromBotCount} из {newTasks} новых задач пришли из Telegram-бота</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
