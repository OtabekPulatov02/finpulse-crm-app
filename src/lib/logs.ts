import { fmtTs, type LogRow } from "../api";

export const EVENT_LABEL: Record<string, string> = {
  task_created: "Задача создана",
  task_assigned: "Назначен исполнитель",
  task_done: "Задача выполнена",
  task_reused: "Задача создана повторно",
  new_company: "Новая компания",
  status_changed: "Изменён статус задачи",
  group_send_failed: "Ошибка отправки в группу",
  // ИИ-бухгалтер
  ai_autowork_asked: "🤖 ИИ запросил уточнение",
  ai_autowork_done: "🤖 ИИ создал документ в 1С",
  ai_autowork_blocked: "🤖 ИИ не смог выполнить задачу",
  ai_ask_group: "🤖 Вопрос ИИ в группе (/ask)",
  ai_agent_run: "🤖 Запрос в AI-чате",
  ai_chats_cleared: "🤖 История AI-чата очищена",
  task_message_sent: "Сообщение в ленте задачи",
  // Настройки/справочники
  notif_settings_updated: "Настройки уведомлений изменены",
  dicts_updated: "Справочники изменены",
  bot_categories_updated: "Категории бота изменены",
  bot_positions_updated: "Должности изменены",
  tariffs_updated: "Тарифы изменены",
  // 1С
  "1c_sync_departments": "Синк подразделений 1С",
  "1c_sync_employees": "Синк сотрудников 1С",
  "1c_sync_positions": "Синк должностей 1С",
  "1c_sync_orgs": "Синк организаций 1С",
  "1c_sync_counterparties": "Синк контрагентов 1С",
  "1c_sync_contracts": "Синк договоров 1С",
  "1c_sync_nomenclature": "Синк номенклатуры 1С",
  "1c_cancel_ai_doc": "Отменён документ ИИ в 1С",
  // Клиенты/сотрудники/задачи — общие CRUD-события
  client_created: "Клиент создан",
  client_updated: "Клиент изменён",
  client_deleted: "Клиент удалён",
  client_conflict: "Конфликт данных клиента",
  employee_created: "Сотрудник добавлен",
  employee_updated: "Сотрудник изменён",
  employee_password_reset: "Пароль сотрудника сброшен",
  employee_deleted: "Сотрудник удалён",
  task_updated: "Задача изменена",
  task_deleted: "Задача удалена",
  task_file_attached: "Файл прикреплён к задаче",
  task_file_rejected: "Файл отклонён Telegram",
  task_created_from_reminder: "Задача создана из напоминания",
  calendar_event_created: "Событие календаря создано",
  calendar_event_updated: "Событие календаря изменено",
  calendar_event_deleted: "Событие календаря удалено",
  access_request_approved: "Заявка на доступ одобрена",
  access_request_rejected: "Заявка на доступ отклонена",
  bot_settings_updated: "Настройки бота изменены",
  ops_pack_added: "Пакет операций добавлен клиенту",
  client_phone_changed: "Телефон клиента изменён",
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
