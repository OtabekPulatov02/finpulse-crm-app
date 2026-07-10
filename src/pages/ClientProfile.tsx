import { useEffect, useState } from "react";
import {
  Building2, CheckCircle2, Clock3, KeyRound, ListTodo, Phone, ShieldCheck,
} from "lucide-react";
import { ClientHeader } from "../components/ClientHeader";
import { toast } from "../components/ui";
import {
  changePasswordRequest, fetchBotTasks, fetchClients, type BotTask, type CrmClient,
} from "../api";
import { useSession } from "../auth";

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!current) { toast("Введите текущий пароль"); return; }
    if (next.length < 6) { toast("Новый пароль должен быть не короче 6 символов"); return; }
    if (next !== confirm) { toast("Пароли не совпадают"); return; }
    setSaving(true);
    try {
      const r = await changePasswordRequest(current, next);
      if (r.ok) {
        toast("Пароль изменён");
        setCurrent(""); setNext(""); setConfirm("");
      } else {
        toast(r.error || "Не удалось изменить пароль");
      }
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100 focus:outline-none";

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="size-4" /> Сменить пароль</div>
      <input type="password" autoComplete="current-password" placeholder="Текущий пароль" value={current}
        onChange={(e) => setCurrent(e.target.value)} className={inputClass} />
      <input type="password" autoComplete="new-password" placeholder="Новый пароль" value={next}
        onChange={(e) => setNext(e.target.value)} className={inputClass} />
      <input type="password" autoComplete="new-password" placeholder="Повторите новый пароль" value={confirm}
        onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
      <button disabled={saving}
        className="rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700 disabled:opacity-60">
        {saving ? "Сохраняем…" : "Сохранить пароль"}
      </button>
    </form>
  );
}

export default function ClientProfile() {
  const session = useSession();
  const [client, setClient] = useState<CrmClient | null>(null);
  const [tasks, setTasks] = useState<BotTask[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetchClients().then((cs) => { if (alive) setClient(cs[0] ?? null); }).catch(() => {});
    fetchBotTasks().then((t) => { if (alive) setTasks(t); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const created = tasks?.length ?? 0;
  const inProgress = tasks?.filter((t) => t.status === "in_progress").length ?? 0;
  const done = tasks?.filter((t) => t.status === "done").length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <ClientHeader />

      <main className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6">
        <div>
          <h1 className="text-lg font-semibold">Профиль</h1>
          <p className="mt-0.5 text-sm text-slate-500">Данные компании, статистика по задачам и смена пароля.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Building2 className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{client?.company ?? session?.company ?? session?.name}</div>
              <div className="truncate text-xs text-slate-400">{client?.position || "Контактное лицо не указано"}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-[13px] max-sm:grid-cols-1">
            <div className="flex items-center gap-2 text-slate-500"><Phone className="size-3.5 shrink-0" /> {client?.phone || "—"}</div>
            <div className="flex items-center gap-2 text-slate-500"><ShieldCheck className="size-3.5 shrink-0" /> Тариф: {client?.tariff || "—"}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><ListTodo className="size-3.5" /> Всего создано</div>
            <div className="mt-1.5 text-2xl font-bold tracking-tight">{created}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Clock3 className="size-3.5" /> В работе</div>
            <div className="mt-1.5 text-2xl font-bold tracking-tight text-brand-600">{inProgress}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><CheckCircle2 className="size-3.5" /> Выполнено</div>
            <div className="mt-1.5 text-2xl font-bold tracking-tight text-emerald-600">{done}</div>
          </div>
        </div>

        <PasswordForm />
      </main>
    </div>
  );
}
