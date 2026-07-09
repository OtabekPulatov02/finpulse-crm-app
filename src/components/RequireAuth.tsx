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

export function RequireClientArea() {
  const session = useSession();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== "client") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
