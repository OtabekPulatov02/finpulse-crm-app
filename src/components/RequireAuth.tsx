import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../auth";

/* Общий гейт: без сессии — на /login.
   Роль "client" живёт только в /client/*, остальные роли — везде, кроме /client/*. */
export function RequireAuth() {
  const session = useSession();
  const location = useLocation();
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

export function RequireStaffArea() {
  const session = useSession();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role === "client") return <Navigate to="/client" replace />;
  return <Outlet />;
}

/* Сотрудники/Справочники/Настройки скрыты из навигации для accountant/guest
   (см. hideFor в Layout.tsx), но до этого фикса ничего не мешало открыть
   /employees, /dictionaries или /settings напрямую по URL — только бэкенд
   решал, отдавать данные или нет. Раз уж в навигации это уже помечено как
   admin-only, дублируем то же ограничение на уровне роутинга (defense in
   depth): без этого guest-аккаунт (используется для демо/продаж) мог бы,
   например, добавлять записи в общую базу знаний ИИ через /dictionaries. */
export function RequireAdminArea() {
  const session = useSession();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export function RequireClientArea() {
  const session = useSession();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== "client") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
