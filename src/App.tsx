import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import TopProgressBar from "./components/TopProgressBar";
import { RequireAuth, RequireClientArea, RequireStaffArea } from "./components/RequireAuth";
import Login from "./pages/Login";
import ClientTasks from "./pages/ClientTasks";
import ClientProfile from "./pages/ClientProfile";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import TaskDetailPage from "./pages/TaskDetailPage";
import Clients from "./pages/Clients";
import Calendar from "./pages/Calendar";
import Employees from "./pages/Employees";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Integrations from "./pages/Integrations";

export default function App() {
  return (
    <>
      <TopProgressBar />
      <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route element={<RequireClientArea />}>
            <Route path="/client" element={<ClientTasks />} />
            <Route path="/client/profile" element={<ClientProfile />} />
          </Route>

          <Route element={<RequireStaffArea />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/:id" element={<TaskDetailPage />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/integrations" element={<Integrations />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
