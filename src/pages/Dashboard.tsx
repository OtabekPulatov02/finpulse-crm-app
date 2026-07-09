import { AlertCircle, ArrowUpRight, Building2, CheckCircle2, ListTodo, Send } from "lucide-react";
import { Card, CardHeader, Badge, Avatar } from "../components/ui";
import { employees, tasks, priorityTone } from "../data/demo";

const kpi = [
  { label: "Клиенты", value: "48", trend: "+3 за месяц", icon: Building2, tone: "text-brand-600 bg-brand-50" },
  { label: "Активные задачи", value: "37", trend: "+5 за неделю", icon: ListTodo, tone: "text-violet-600 bg-violet-50" },
  { label: "Выполненные", value: "124", trend: "+12% к июню", icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
  { label: "Просроченные", value: "5", trend: "−2 за неделю", icon: AlertCircle, tone: "text-red-600 bg-red-50" },
];

export default function Dashboard() {
  const today = tasks.filter((t) => t.status !== "Выполнена" && t.status !== "Отменена").slice(0, 4);
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
        <Card className="col-span-3 max-xl:col-span-1">
          <CardHeader title="Задачи на сегодня" />
          <div className="divide-y divide-slate-100">
            {today.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                <input type="checkbox" className="size-4 accent-brand-600" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-medium">{t.title}</div>
                  <div className="text-xs text-slate-400">{t.client} · {t.assignee}</div>
                </div>
                {t.fromBot && <Send className="size-3.5 text-cyan-500" />}
                <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
                <span className="text-xs whitespace-nowrap text-slate-400">до {t.due}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="col-span-2 max-xl:col-span-1">
          <CardHeader title="Загрузка сотрудников" />
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
    </div>
  );
}
