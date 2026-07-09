import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Clients from "./pages/Clients";
import Stub from "./pages/Stub";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/calendar" element={<Stub title="Календарь" note="Налоги, отчёты и платежи — переносим из прототипа" />} />
        <Route path="/employees" element={<Stub title="Сотрудники" note="Карточки команды и загрузка" />} />
        <Route path="/analytics" element={<Stub title="Аналитика" note="Производительность и статистика" />} />
        <Route path="/settings" element={<Stub title="Настройки" note="Роли, справочники, логи системы" />} />
        <Route path="/integrations" element={<Stub title="Интеграции" note="Telegram-бот и база данных" />} />
      </Route>
    </Routes>
  );
}
