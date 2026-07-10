import { ListTodo, LogOut, User } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearSession } from "../auth";

/* Общая шапка кабинета клиента — используется на странице задач и в
   профиле. Лишние данные о компании убраны из шапки (см. ClientProfile),
   здесь остаются только логотип, переключение между разделами и выход —
   чтобы на маленьких экранах шапка не переполнялась. */
export function ClientHeader() {
  const navigate = useNavigate();

  function logout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition ${
      isActive ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 text-base font-extrabold text-white">
          F
        </div>
        <div className="hidden text-base font-bold tracking-tight sm:block">
          fin<span className="text-red-500">pulse</span>
          <span className="ml-1 text-xs font-semibold text-slate-400">Кабинет клиента</span>
        </div>

        <nav className="ml-1 flex items-center gap-1 sm:ml-3">
          <NavLink to="/client" end className={tabClass}>
            <ListTodo className="size-4" /> <span className="hidden sm:inline">Мои задачи</span>
          </NavLink>
          <NavLink to="/client/profile" className={tabClass}>
            <User className="size-4" /> <span className="hidden sm:inline">Профиль</span>
          </NavLink>
        </nav>

        <button
          onClick={logout}
          className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 sm:px-2.5"
        >
          <LogOut className="size-4" /> <span className="hidden sm:inline">Выйти</span>
        </button>
      </div>
    </header>
  );
}
