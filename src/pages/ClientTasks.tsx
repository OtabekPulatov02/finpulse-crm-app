import { useEffect, useState } from "react";
import { LogOut, Paperclip } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchBotTasks, fmtTs, type BotTask } from "../api";
import { clearSession, useSession } from "../auth";

const STATUS_LABEL: Record<BotTask["status"], string> = {
  new: "Новая", in_progress: "В работе", done: "Выполнена",
};
const STATUS_TONE: Record<BotTask["status"], string> = {
  new: "bg-violet-50 text-violet-600 border-violet-200",
  in_progress: "bg-brand-50 text-brand-600 border-brand-200",
  done: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

export default function ClientTasks() {
  const session = useSession();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<BotTask[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchBotTasks()
      .then((t) => { if (alive) setTasks(t); })
      .catch(() => { if (alive) setError("Не удалось загрузить задачи. Попробуйте обновить страницу."); });
    return () => { alive = false; };
  }, []);

  function logout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-6">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 text-base font-extrabold text-white">
          F
        </div>
        <div className="text-base font-bold tracking-tight">
          fin<span className="text-red-500">pulse</span>
          <span className="ml-1 text-xs font-semibold text-slate-400">Кабинет клиента</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="text-[13px] font-medium text-slate-600">{session?.company || session?.name}</div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="size-4" /> Выйти
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <h1 className="mb-1 text-lg font-semibold">Мои задачи</h1>
        <p className="mb-5 text-sm text-slate-500">
          Статусы обновляются автоматически, как только бухгалтер берёт задачу в работу или завершает её.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600">{error}</div>
        )}

        {tasks === null && !error && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">Загрузка…</div>
        )}

        {tasks !== null && tasks.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
            Пока нет задач. Напишите боту Finpulse в Telegram, чтобы создать первую.
          </div>
        )}

        <div className="space-y-3">
          {tasks?.map((t) => (
            <div key={t.num} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-1.5 flex items-start justify-between gap-3">
                <div className="text-sm font-medium text-slate-900">№{t.num}</div>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_TONE[t.status]}`}>
                  <span className="size-1.5 rounded-full bg-current" />
                  {STATUS_LABEL[t.status]}
                </span>
              </div>
              <div className="mb-2 text-[13.5px] leading-snug text-slate-700">{t.text}</div>
              <div className="flex items-center gap-3 text-[12px] text-slate-400">
                <span>{fmtTs(t.createdAt)}</span>
                {t.assignee && <span>· Исполнитель: {t.assignee}</span>}
                {t.files > 0 && (
                  <span className="flex items-center gap-1"><Paperclip className="size-3" /> {t.files}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
