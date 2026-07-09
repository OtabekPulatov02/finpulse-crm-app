import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  AlertCircle, BarChart3, Bell, Building2, CalendarDays, CheckCheck, ChevronDown,
  LayoutDashboard, ListTodo, LogOut, Search, Send, Settings, User, Users,
} from "lucide-react";
import { useEffect } from "react";
import { Avatar, Menu, MenuDivider, MenuItem, Toaster, toast } from "./ui";
import { displayStatus, hydrateFromBot, isOverdue, resetTasksStore, useTasks } from "../store/tasks";
import { hydrateClients, resetClientsStore } from "../store/clients";
import { resetEmployeesStore } from "../store/employees";
import { clearSession, ROLE_LABEL, useSession } from "../auth";

const ALL_NAV = [
  { to: "/dashboard", label: "Дашборд", icon: LayoutDashboard, hideFor: [] as string[] },
  { to: "/tasks", label: "Задачи", icon: ListTodo, count: true, hideFor: [] as string[] },
  { to: "/calendar", label: "Календарь", icon: CalendarDays, hideFor: [] as string[] },
  { to: "/clients", label: "Клиенты", icon: Building2, hideFor: [] as string[] },
  { to: "/employees", label: "Сотрудники", icon: Users, hideFor: ["accountant", "guest"] },
  { to: "/analytics", label: "Аналитика", icon: BarChart3, hideFor: [] as string[] },
  { to: "/settings", label: "Настройки", icon: Settings, hideFor: ["accountant", "guest"] },
];

export default function Layout() {
  const tasks = useTasks();
  const session = useSession();
  useEffect(() => { void hydrateFromBot(); void hydrateClients(); }, []);
  const activeCount = tasks.filter((t) => t.status === "Новая" || t.status === "В работе").length;
  const notifications = [
    ...tasks
      .filter((t) => t.fromBot && displayStatus(t) === "Новая")
      .map((t) => ({
        id: t.id,
        icon: Send, tone: "bg-brand-50 text-brand-600",
        title: `Новое обращение из Telegram: ${t.client}`,
        time: t.created ?? "",
      })),
    ...tasks
      .filter(isOverdue)
      .map((t) => ({
        id: t.id,
        icon: AlertCircle, tone: "bg-red-50 text-red-600",
        title: `Просрочена задача «${t.title}»`,
        time: `срок был ${t.due}`,
      })),
  ]
    .sort((a, b) => b.id - a.id)
    .slice(0, 3);
  const navigate = useNavigate();
  const role = session?.role || "admin";
  const nav = ALL_NAV.filter((item) => !item.hideFor.includes(role));
  const displayName = session?.name || "Ибрагимова Юлдуз";
  const roleLabel = session ? ROLE_LABEL[session.role] : "Главбух · супер-админ";

  function logout() {
    clearSession();
    resetTasksStore();
    resetClientsStore();
    resetEmployeesStore();
    navigate("/login", { replace: true });
  }

  return (
    <div className={`flex min-h-screen ${role === "guest" ? "pt-6" : ""}`}>
      {role === "guest" && (
        <div className="fixed inset-x-0 top-0 z-30 bg-amber-500 py-1 text-center text-[12px] font-medium text-white">
          Гостевой режим — демо-данные, действия недоступны
        </div>
      )}
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
                  {activeCount}
                </span>
              )}
            </NavLink>
          ))}
          {role !== "guest" && (
            <>
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
            </>
          )}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <div className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-slate-100">
            <Avatar name={displayName} />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold">{displayName}</div>
              <div className="text-[11px] text-slate-400">{roleLabel}</div>
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
          <div className="ml-auto flex items-center gap-1.5">
            <Menu trigger={
              <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                <Bell className="size-[18px]" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full border-2 border-white bg-red-500" />
                )}
              </button>
            }>
              <div className="px-3.5 pt-1 pb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">Уведомления</div>
              {notifications.length ? notifications.map((n) => (
                <div key={n.id + n.title} className="flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-slate-50">
                  <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${n.tone}`}>
                    <n.icon className="size-3.5" />
                  </span>
                  <div>
                    <div className="text-[12.5px] leading-snug font-medium">{n.title}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">{n.time}</div>
                  </div>
                </div>
              )) : (
                <div className="px-3.5 py-6 text-center text-[12.5px] text-slate-400">Новых уведомлений нет</div>
              )}
              {notifications.length > 0 && (
                <>
                  <MenuDivider />
                  <MenuItem icon={<CheckCheck className="size-4" />} onClick={() => toast("Все уведомления отмечены прочитанными")}>
                    Отметить всё прочитанным
                  </MenuItem>
                </>
              )}
            </Menu>
            <Menu trigger={
              <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100">
                <Avatar name={displayName} />
                <span className="text-[13px] font-medium max-sm:hidden">{displayName.split(" ")[0]}</span>
                <ChevronDown className="size-3.5 text-slate-400" />
              </button>
            }>
              {role !== "guest" && role !== "accountant" && (
                <MenuItem icon={<User className="size-4" />} onClick={() => navigate("/employees")}>Мой профиль</MenuItem>
              )}
              {role !== "guest" && role !== "accountant" && (
                <MenuItem icon={<Settings className="size-4" />} onClick={() => navigate("/settings")}>Настройки</MenuItem>
              )}
              <MenuDivider />
              <MenuItem danger icon={<LogOut className="size-4" />} onClick={logout}>Выйти</MenuItem>
            </Menu>
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
