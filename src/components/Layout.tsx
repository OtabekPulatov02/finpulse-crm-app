import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3, Bell, Building2, CalendarDays, LayoutDashboard,
  ListTodo, Search, Send, Settings, Users,
} from "lucide-react";
import { Avatar, Toaster } from "./ui";

const nav = [
  { to: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { to: "/tasks", label: "Задачи", icon: ListTodo, count: 37 },
  { to: "/calendar", label: "Календарь", icon: CalendarDays },
  { to: "/clients", label: "Клиенты", icon: Building2 },
  { to: "/employees", label: "Сотрудники", icon: Users },
  { to: "/analytics", label: "Аналитика", icon: BarChart3 },
  { to: "/settings", label: "Настройки", icon: Settings },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white max-lg:hidden">
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 text-base font-extrabold text-white">
            F
          </div>
          <div className="text-base font-bold tracking-tight">
            fin<span className="text-red-500">pulse</span>
            <span className="ml-1 text-xs font-semibold text-slate-400">CRM</span>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
          {nav.map(({ to, label, icon: Icon, count }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-brand-50 text-brand-600" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <Icon className="size-[18px]" />
              {label}
              {count && (
                <span className="ml-auto rounded-full bg-slate-100 px-2 text-[11px] font-semibold text-slate-500">
                  {count}
                </span>
              )}
            </NavLink>
          ))}
          <div className="mt-4 mb-1 px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Интеграции
          </div>
          <NavLink
            to="/integrations"
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-brand-50 text-brand-600" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`
            }
          >
            <Send className="size-[18px]" />
            Telegram
          </NavLink>
        </nav>
        <div className="border-t border-slate-200 p-3">
          <div className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-slate-100">
            <Avatar name="Ибрагимова Юлдуз" />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold">Ибрагимова Юлдуз</div>
              <div className="text-[11px] text-slate-400">Главбух · супер-админ</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Поиск…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-[13px] transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100 focus:outline-none"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
              <Bell className="size-[18px]" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full border-2 border-white bg-red-500" />
            </button>
            <Avatar name="Ибрагимова Юлдуз" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-6">
          <Outlet />
        </main>
        <Toaster />
      </div>
    </div>
  );
}
