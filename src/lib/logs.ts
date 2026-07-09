import { fmtTs, type LogRow } from "../api";

export const EVENT_LABEL: Record<string, string> = {
  task_created: "Задача создана",
  task_assigned: "Назначен исполнитель",
  task_done: "Задача выполнена",
  task_reused: "Задача создана повторно",
  new_company: "Новая компания",
  status_changed: "Изменён статус задачи",
  group_send_failed: "Ошибка отправки в группу",
};

const ST_RU: Record<string, string> = { new: "Новая", in_progress: "В работе", done: "Выполнена" };

export interface LogView {
  ts?: string;
  time: string;
  src: "tg" | "crm";
  event: string;
  who: string;
  assignee: string;
  details: string;
}

export function mapLog(l: LogRow, src: "tg" | "crm"): LogView {
  const isStatus = l.event === "status_changed";
  const parts = [
    l.num ? `№ ${l.num}` : null,
    isStatus && l.from && l.to ? `«${ST_RU[String(l.from)] ?? l.from}» → «${ST_RU[String(l.to)] ?? l.to}»` : null,
    l.company ? String(l.company) : null,
    l.text ? `«${String(l.text).slice(0, 60)}${String(l.text).length > 60 ? "…" : ""}»` : null,
    typeof l.files === "number" && l.files ? `📎 ${l.files}` : null,
  ].filter(Boolean);
  return {
    ts: l.ts,
    time: fmtTs(l.ts),
    src,
    event: EVENT_LABEL[l.event] ?? l.event,
    who: String((isStatus ? l.by : l.from) ?? l.by ?? "—"),
    assignee: l.assignee ? String(l.assignee) : "—",
    details: parts.join(" · "),
  };
}
