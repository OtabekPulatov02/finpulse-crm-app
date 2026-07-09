import { AlertCircle, Building2, CheckCircle2, Download, FilePlus2 } from "lucide-react";
import { Avatar, Badge, Card, CardHeader, toast } from "../components/ui";

const perf = [
  { name: "Анна Смирнова", done: 9, avg: "1,6 дня", overdue: 1, ontime: 89 },
  { name: "Елена Крылова", done: 8, avg: "2,1 дня", overdue: 0, ontime: 100 },
  { name: "Дмитрий Орлов", done: 7, avg: "1,9 дня", overdue: 2, ontime: 78 },
  { name: "Ольга Никитина", done: 4, avg: "3,2 дня", overdue: 1, ontime: 80 },
];
const statuses = [
  { label: "В работе", n: 24, w: 77, c: "bg-brand-500" },
  { label: "Выполнены", n: 19, w: 61, c: "bg-emerald-500" },
  { label: "Новые", n: 14, w: 45, c: "bg-violet-500" },
  { label: "Отменены", n: 5, w: 16, c: "bg-slate-400" },
];
const kpi = [
  { label: "Клиенты", value: "48", icon: Building2, tone: "text-brand-600 bg-brand-50" },
  { label: "Новые задачи", value: "26", icon: FilePlus2, tone: "text-violet-600 bg-violet-50" },
  { label: "Выполнено", value: "31", icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
  { label: "Просрочено", value: "5", icon: AlertCircle, tone: "text-red-600 bg-red-50" },
];

export default function Analytics() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Аналитика</h1>
          <p className="mt-0.5 text-sm text-slate-500">Показатели за июль {new Date().getFullYear()}</p>
        </div>
        <button onClick={() => toast("Отчёт выгружен в Excel (демо)")} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50">
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
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold tracking-wider text-slate-400 uppercase">
                <th className="px-5 py-3">Сотрудник</th>
                <th className="px-4 py-3">Выполнено</th>
                <th className="px-4 py-3">Ср. время</th>
                <th className="px-4 py-3">Просрочено</th>
                <th className="px-4 py-3">В срок</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {perf.map((p) => (
                <tr key={p.name} className="hover:bg-slate-50">
                  <td className="px-5 py-3"><span className="flex items-center gap-2.5 font-medium"><Avatar name={p.name} />{p.name}</span></td>
                  <td className="px-4 py-3 font-semibold">{p.done}</td>
                  <td className="px-4 py-3">{p.avg}</td>
                  <td className="px-4 py-3">{p.overdue}</td>
                  <td className="px-4 py-3"><Badge tone={p.ontime >= 90 ? "green" : "yellow"}>{p.ontime}%</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="col-span-2 max-xl:col-span-1">
          <CardHeader title="Статистика по статусам" />
          <div className="space-y-3.5 p-5">
            {statuses.map((s) => (
              <div key={s.label} className="grid grid-cols-[90px_1fr_32px] items-center gap-3 text-[13px]">
                <span className="text-slate-500">{s.label}</span>
                <div className="h-5 overflow-hidden rounded bg-slate-100">
                  <div className={`h-full rounded ${s.c}`} style={{ width: `${s.w}%` }} />
                </div>
                <span className="text-right font-semibold">{s.n}</span>
              </div>
            ))}
            <p className="pt-2 text-xs text-slate-400">14 из 26 новых задач пришли из Telegram-бота</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
