import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Avatar, Card, Field, Input, Modal, Select, toast } from "../components/ui";

const team = [
  { name: "Ибрагимова Юлдуз Ахмедовна", role: "Главный бухгалтер · супер-админ", load: 62, clients: 8, active: 6, done: 214 },
  { name: "Крылова Елена Викторовна", role: "Ведущий бухгалтер", load: 85, clients: 12, active: 9, done: 156 },
  { name: "Орлов Дмитрий Андреевич", role: "Бухгалтер", load: 64, clients: 10, active: 8, done: 118 },
  { name: "Смирнова Анна Павловна", role: "Бухгалтер по зарплате", load: 92, clients: 14, active: 11, done: 203 },
  { name: "Васильев Игорь Максимович", role: "Младший бухгалтер", load: 41, clients: 6, active: 4, done: 47 },
  { name: "Никитина Ольга Сергеевна", role: "Налоговый консультант", load: 58, clients: 6, active: 5, done: 89 },
];

const POSITIONS = ["Бухгалтер", "Главный бухгалтер", "Бухгалтер по зарплате", "Младший бухгалтер", "Налоговый консультант"];
const ROLES = ["Бухгалтер", "Руководитель", "Администратор"];

export default function Employees() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Сотрудники</h1>
          <p className="mt-0.5 text-sm text-slate-500">{team.length} сотрудников · средняя загрузка 67%</p>
        </div>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700">
          <UserPlus className="size-4" /> Добавить сотрудника
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        {team.map((e) => (
          <Card key={e.name} className="cursor-pointer p-5 transition hover:-translate-y-px hover:shadow-md">
            <div className="flex items-center gap-3">
              <Avatar name={e.name} className="!size-11 !text-sm" />
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold">{e.name}</div>
                <div className="truncate text-xs text-slate-400">{e.role}</div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2.5">
              <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${e.load > 85 ? "bg-red-500" : e.load > 70 ? "bg-amber-500" : "bg-brand-500"}`} style={{ width: `${e.load}%` }} />
              </div>
              <span className="text-xs font-semibold text-slate-500">{e.load}%</span>
            </div>
            <div className="mt-4 grid grid-cols-3 border-t border-slate-100 pt-3.5 text-center">
              <div><div className="text-base font-bold">{e.clients}</div><div className="text-[11px] text-slate-400">Клиенты</div></div>
              <div><div className="text-base font-bold">{e.active}</div><div className="text-[11px] text-slate-400">Активные</div></div>
              <div><div className="text-base font-bold">{e.done}</div><div className="text-[11px] text-slate-400">Выполнено</div></div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Новый сотрудник" wide
        footer={
          <>
            <button onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium hover:bg-slate-50">Отмена</button>
            <button
              onClick={() => { toast("Сотрудник добавлен — приглашение отправлено на почту"); setOpen(false); }}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700">
              <UserPlus className="size-4" /> Добавить
            </button>
          </>
        }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <Field label="Фамилия" required><Input placeholder="Петрова" autoFocus /></Field>
            <Field label="Имя и отчество" required><Input placeholder="Мария Сергеевна" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <Field label="Должность"><Select>{POSITIONS.map((p) => <option key={p}>{p}</option>)}</Select></Field>
            <Field label="Роль в системе"><Select>{ROLES.map((r) => <option key={r}>{r}</option>)}</Select></Field>
          </div>
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <Field label="Электронная почта" required><Input type="email" placeholder="m.petrova@finpulse.uz" /></Field>
            <Field label="Телефон"><Input type="tel" placeholder="+998 90 000-00-00" /></Field>
          </div>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" defaultChecked className="size-4 accent-brand-600" />
            Отправить приглашение на почту
          </label>
        </div>
      </Modal>
    </div>
  );
}
