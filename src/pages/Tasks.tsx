import { Plus, Send } from "lucide-react";
import { Avatar, Badge, Card } from "../components/ui";
import { tasks, type TaskStatus } from "../data/demo";

const columns: { status: TaskStatus; dot: string }[] = [
  { status: "Новая", dot: "bg-violet-500" },
  { status: "В работе", dot: "bg-brand-500" },
  { status: "Ожидание", dot: "bg-amber-500" },
  { status: "Выполнена", dot: "bg-emerald-500" },
  { status: "Отменена", dot: "bg-slate-400" },
];

const prioBorder: Record<string, string> = {
  "Низкий": "border-l-slate-300", "Средний": "border-l-brand-500",
  "Высокий": "border-l-amber-500", "Критический": "border-l-red-500",
};

export default function Tasks() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Задачи</h1>
          <p className="mt-0.5 text-sm text-slate-500">37 активных · 5 просроченных</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700">
          <Plus className="size-4" /> Создать задачу
        </button>
      </div>

      <div className="grid grid-cols-5 items-start gap-3 overflow-x-auto pb-2 max-xl:grid-cols-[repeat(5,260px)]">
        {columns.map(({ status, dot }) => {
          const items = tasks.filter((t) => t.status === status);
          return (
            <div key={status} className="min-w-60 rounded-xl bg-slate-100/70 p-2.5">
              <div className="flex items-center gap-2 px-1.5 pb-2.5 text-[13px] font-semibold">
                <span className={`size-2 rounded-full ${dot}`} />
                {status}
                <span className="ml-auto text-xs font-medium text-slate-400">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((t) => (
                  <Card key={t.id} className={`cursor-pointer border-l-[3px] p-3 transition hover:-translate-y-px hover:shadow-md ${prioBorder[t.priority]}`}>
                    <div className="line-clamp-2 text-[13px] leading-snug font-semibold">{t.title}</div>
                    <div className="mt-1 text-xs text-slate-400">{t.client}</div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        {t.fromBot && <Send className="size-3 text-cyan-500" />}
                        {t.due}
                      </span>
                      <Avatar name={t.assignee} className="!size-6 !text-[10px]" />
                    </div>
                  </Card>
                ))}
                {!items.length && (
                  <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                    Пусто
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { Badge };
