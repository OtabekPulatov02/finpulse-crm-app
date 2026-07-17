import { useEffect, useRef, useState } from "react";
import {
  Banknote, Building2, CheckCircle2, Clock3, Hash, KeyRound, ListTodo, MapPin, Phone, ShieldCheck,
} from "lucide-react";
import { Badge, toast, type Tone } from "../components/ui";
import { formatPhone } from "../lib/phone";
import {
  changePasswordRequest, fetchBotTasks, fetchClientBalance, fetchClients,
  type BotTask, type ClientBalanceResult, type CrmClient,
} from "../api";
import { useSession } from "../auth";

const STATUS_LABEL: Record<string, string> = {
  active: "Активный", pending: "Ожидает активации", archived: "В архиве",
};
const STATUS_TONE: Record<string, Tone> = {
  active: "green", pending: "cyan", archived: "gray",
};

const TABS = [
  { id: "company", label: "Компания" },
  { id: "stats", label: "Статистика" },
  { id: "finance", label: "Финансы" },
  { id: "password", label: "Пароль" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-medium text-slate-400">{label}</div>
        <div className="truncate text-[13.5px] font-medium text-slate-700">{value || "—"}</div>
      </div>
    </div>
  );
}

function CompanyTab({ client }: { client: CrmClient | null }) {
  if (!client) {
    return <p className="py-8 text-center text-sm text-slate-400">Карточка компании ещё не создана бухгалтером.</p>;
  }
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-base font-semibold">{client.company}</div>
        <Badge tone={STATUS_TONE[client.status] ?? "gray"}>{STATUS_LABEL[client.status] ?? client.status}</Badge>
      </div>
      <div className="divide-y divide-slate-100">
        <InfoRow icon={Phone} label="Телефон" value={formatPhone(client.phone)} />
        <InfoRow icon={Building2} label="Должность контакта" value={client.position ?? ""} />
        <InfoRow icon={ShieldCheck} label="Тариф" value={client.tariff ?? ""} />
        <InfoRow icon={Hash} label="ИНН" value={client.inn ?? ""} />
        <InfoRow icon={Banknote} label="МФО" value={client.mfo ?? ""} />
        <InfoRow icon={Banknote} label="Расчётный счёт" value={client.bankAccount ?? ""} />
        <InfoRow icon={MapPin} label="Юридический адрес" value={client.address ?? ""} />
        <InfoRow icon={Building2} label="Ответственный бухгалтер" value={client.assignedTo ?? "не назначен"} />
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Реквизиты (ИНН, МФО, счёт, адрес) заполняет ваш бухгалтер — если что-то указано неверно, напишите в Telegram-боте.
      </p>
    </div>
  );
}

function StatsTab({ tasks }: { tasks: BotTask[] | null }) {
  const created = tasks?.length ?? 0;
  const inProgress = tasks?.filter((t) => t.status === "in_progress").length ?? 0;
  const done = tasks?.filter((t) => t.status === "done").length ?? 0;
  return (
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
  );
}

function money(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " UZS";
}

function FinanceTab({ balance, loading, error }: { balance: ClientBalanceResult | null; loading: boolean; error: string | null }) {
  if (loading) return <p className="py-8 text-center text-sm text-slate-400">Загружаем данные из 1С…</p>;
  if (error && !balance) {
    return <p className="py-8 text-center text-sm text-rose-500">Не удалось загрузить данные: {error}. Попробуйте обновить страницу.</p>;
  }
  if (!balance || balance.demo) {
    return <p className="py-8 text-center text-sm text-slate-400">Демо-доступ — финансовые данные скрыты.</p>;
  }
  if (!balance.ok) {
    return <p className="py-8 text-center text-sm text-slate-400">{balance.error || "Не удалось загрузить данные из 1С."}</p>;
  }
  const r = balance.receivables;
  const cash = balance.cash;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Banknote className="size-3.5" /> Оценка остатка средств</div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight">
            {cash?.ok ? money(cash.estimate) : "—"}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {cash?.ok ? cash.note : (cash?.error || "Недоступно")}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Hash className="size-3.5" /> Выставлено счетов/реализаций</div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight">
            {r?.ok ? money((r.invoicedTotal ?? 0) + (r.shippedTotal ?? 0)) : "—"}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {r?.ok ? `${r.invoicesCount} счетов, ${r.shipmentsCount} реализаций` : (r?.error || "Недоступно")}
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-400">
        {r?.ok ? r.note : ""}
      </p>
    </div>
  );
}

function PasswordTab() {
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
    <form onSubmit={submit} className="max-w-sm space-y-3">
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
  const [tab, setTab] = useState<TabId>("company");
  const [balance, setBalance] = useState<ClientBalanceResult | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchClients().then((cs) => { if (alive) setClient(cs[0] ?? null); }).catch(() => {});
    fetchBotTasks().then((t) => { if (alive) setTasks(t); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const balanceLoadingRef = useRef(false);
  useEffect(() => {
    if (tab !== "finance" || balance || balanceError || balanceLoadingRef.current) return;
    let alive = true;
    balanceLoadingRef.current = true;
    setBalanceLoading(true);
    fetchClientBalance()
      .then((b) => { if (alive) setBalance(b); })
      .catch((e) => { if (alive) setBalanceError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { balanceLoadingRef.current = false; if (alive) setBalanceLoading(false); });
    return () => { alive = false; };
  }, [tab, balance, balanceError]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Профиль</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {client?.company ?? session?.company ?? session?.name} — данные компании, статистика по задачам и смена пароля.
        </p>
      </div>

      <div className="flex gap-1.5 rounded-lg bg-slate-100 p-1 max-w-max">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-md px-3.5 py-1.5 text-[13px] font-medium transition ${
              tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {tab === "company" && <CompanyTab client={client} />}
        {tab === "stats" && <StatsTab tasks={tasks} />}
        {tab === "finance" && <FinanceTab balance={balance} loading={balanceLoading} error={balanceError} />}
        {tab === "password" && <PasswordTab />}
      </div>
    </div>
  );
}
