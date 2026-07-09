import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest, guestLoginRequest } from "../api";
import { setSession, type Role } from "../auth";
import { resetTasksStore } from "../store/tasks";
import { resetClientsStore } from "../store/clients";
import { resetEmployeesStore } from "../store/employees";
import { resetCalendarEventsStore } from "../store/calendarEvents";

export default function Login() {
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!identity.trim() || !password) {
      setError("Заполните оба поля");
      return;
    }
    setLoading(true);
    try {
      const res = await loginRequest(identity.trim(), password);
      if (!res.ok || !res.token || !res.role) {
        setError(res.error === "invalid credentials" ? "Неверный логин или пароль" : (res.error || "Не удалось войти"));
        return;
      }
      resetTasksStore();
      resetClientsStore();
      resetEmployeesStore();
      resetCalendarEventsStore();
      setSession({ token: res.token, role: res.role as Role, name: res.name || identity, company: res.company });
      navigate(res.role === "client" ? "/client" : "/dashboard", { replace: true });
    } catch {
      setError("Сервер недоступен. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  }

  async function loginAsGuest() {
    setError(null);
    setLoading(true);
    try {
      const res = await guestLoginRequest();
      if (!res.ok || !res.token) {
        setError(res.error || "Гостевой режим недоступен");
        return;
      }
      resetTasksStore();
      resetClientsStore();
      resetEmployeesStore();
      resetCalendarEventsStore();
      setSession({ token: res.token, role: "guest", name: "Гость" });
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Сервер недоступен. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 text-base font-extrabold text-white">
            F
          </div>
          <div className="text-base font-bold tracking-tight">
            fin<span className="text-red-500">pulse</span>
            <span className="ml-1 text-xs font-semibold text-slate-400">CRM</span>
          </div>
        </div>

        <h1 className="mb-1 text-lg font-semibold">Вход в систему</h1>
        <p className="mb-5 text-sm text-slate-500">
          Сотрудники — по логину, клиенты — по номеру телефона.
        </p>

        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label className="mb-1 block text-[13px] font-medium text-slate-700">Логин или телефон</label>
            <input
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder="+998901234567 или логин"
              autoComplete="username"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-slate-700">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100 focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? "Входим…" : "Войти"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-[11px] text-slate-400">
          <div className="h-px flex-1 bg-slate-200" /> или <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          onClick={loginAsGuest}
          disabled={loading}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Войти как гость (демо-доступ)
        </button>

        <p className="mt-5 text-center text-[12px] text-slate-400">
          Пароль для клиента приходит в Telegram-боте после регистрации.
        </p>
      </div>
    </div>
  );
}
