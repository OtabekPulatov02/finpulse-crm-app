import { useState } from "react";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { Avatar, Badge, Card, type Tone } from "../components/ui";
import { clients } from "../data/demo";

const statusTone: Record<string, Tone> = {
  "Активный": "green", "Новый": "blue", "Из бота": "cyan", "В архиве": "gray",
};

export default function Clients() {
  const [q, setQ] = useState("");
  const filtered = clients.filter((c) =>
    (c.name + c.contact + c.inn).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Клиенты</h1>
          <p className="mt-0.5 text-sm text-slate-500">48 компаний · 1 из бота ожидает активации</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700">
          <Plus className="size-4" /> Добавить клиента
        </button>
      </div>

      <Card>
        <div className="border-b border-slate-200 p-4">
          <div className="relative max-w-xs">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по названию, ИНН, контакту"
              className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-[13px] focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold tracking-wider text-slate-400 uppercase">
                <th className="px-4 py-3">Компания</th>
                <th className="px-4 py-3">Контакт</th>
                <th className="px-4 py-3">Ответственный</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Задачи</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.name} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-slate-400">ИНН {c.inn} · {c.tax}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{c.contact}</div>
                    <div className="text-xs text-slate-400">{c.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    {c.manager === "не назначен" ? (
                      <span className="text-slate-400">не назначен</span>
                    ) : (
                      <span className="flex items-center gap-2"><Avatar name={c.manager} />{c.manager}</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><Badge tone={statusTone[c.status]}>{c.status}</Badge></td>
                  <td className="px-4 py-3 font-semibold">{c.activeTasks}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                      <MoreHorizontal className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <div className="p-10 text-center text-sm text-slate-400">Ничего не найдено</div>
          )}
        </div>
      </Card>
    </div>
  );
}
