import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Archive, Calendar, Check, Copy, ExternalLink, Hash, Kanban, LayoutList, MoreHorizontal,
  Paperclip, Pencil, Plus, RotateCcw, Search, Send, Trash2, X,
} from "lucide-react";
import {
  Avatar, Badge, Card, ConfirmModal, Field, Input, Menu, MenuDivider,
  MenuItem, Modal, Select, Textarea, toast,
} from "../components/ui";
import {
  EDITABLE_STATUSES, PRIORITIES, STATUSES,
  priorityTone, statusTone, type Priority, type Task, type TaskStatus,
} from "../data/demo";
import { createTask, deleteTaskEverywhere, displayStatus, editTask, isOverdue, sendMessage, setTaskStatus, useTasks } from "../store/tasks";
import { hydrateClients, useClients } from "../store/clients";
import { hydrateEmployees, useEmployees } from "../store/employees";
import { attachTaskFileRequest, fetchLogs, fmtTs, openTaskFile } from "../api";
import { mapLog, type LogView } from "../lib/logs";
import { formatSumsInText } from "../lib/amount";

/* ---------------- Вспомогательное ---------------- */

const columns: { status: TaskStatus; dot: string; ring: string }[] = [
  { status: "Новая", dot: "bg-violet-500", ring: "ring-violet-300 bg-violet-50/60" },
  { status: "В работе", dot: "bg-brand-500", ring: "ring-brand-300 bg-brand-50/60" },
  { status: "Выполнена", dot: "bg-emerald-500", ring: "ring-emerald-300 bg-emerald-50/60" },
  { status: "Отменено", dot: "bg-red-500", ring: "ring-red-300 bg-red-50/60" },
  { status: "Архив", dot: "bg-slate-400", ring: "ring-slate-300 bg-slate-100/80" },
];

const prioBorder: Record<Priority, string> = {
  "Низкий": "border-l-slate-300",
  "Средний": "border-l-brand-500",
  "Высокий": "border-l-amber-500",
  "Критический": "border-l-red-500",
};

function sourceLabel(t: Task) {
  if (t.source === "crm") return "из CRM";
  if (t.fromBot) return "из Telegram";
  if (t.fromCalendar) return "из календаря";
  return null;
}

/* ---------------- Форма задачи (создание/изменение) ---------------- */

export function TaskFormModal({
  open, onClose, task, defaultStatus,
}: { open: boolean; onClose: () => void; task?: Task | null; defaultStatus?: TaskStatus }) {
  const clients = useClients();
  const employees = useEmployees();
  useEffect(() => { void hydrateClients(); void hydrateEmployees(); }, []);
  const clientOptions = clients.length ? clients.map((c) => c.company) : [task?.client ?? ""].filter(Boolean);
  const employeeNames = employees.filter((e) => e.active).map((e) => e.name);

  const [title, setTitle] = useState(task?.title ?? "");
  const [client, setClient] = useState(task?.client ?? clientOptions[0] ?? "");
  const [assignee, setAssignee] = useState(task?.assignee ?? "auto");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus ?? "Новая");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "Средний");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setFile(null); }, [task, open]);

  const submit = async () => {
    if (!title.trim()) { toast("Укажите название задачи"); return; }
    if (!client) { toast("Выберите клиента"); return; }
    /* "auto" передаём как есть — сам API/стор превращает его в "без
       исполнителя" (assignee: undefined), чтобы задача осталась в статусе
       "Новая" до тех пор, пока кто-то реально не возьмёт её в работу.
       Раньше здесь подставлялся первый сотрудник из списка, из-за чего
       любая новая задача сразу считалась "в работе". */
    const assigneeFinal = assignee;
    const clientId = clients.find((c) => c.company === client)?.id ?? null;
    setSaving(true);
    try {
      let targetId: number | undefined = task?.id;
      if (task) {
        const r = await editTask(task.id, {
          title, client, assignee: assigneeFinal, dueDate: dueDate || null, description, status,
        });
        if (!r.ok) { toast(r.error || "Не удалось сохранить изменения"); return; }
        toast("Изменения сохранены — история задачи дополнена");
      } else {
        const r = await createTask({
          title, client, clientId, assignee: assigneeFinal, priority, dueDate: dueDate || null, description,
        });
        if (!r.ok) { toast(r.error || "Не удалось создать задачу"); return; }
        targetId = r.id;
        toast(assignee === "auto" ? "Задача создана" : "Задача создана и назначена исполнителю");
      }
      if (file && targetId) {
        const fr = await attachTaskFileRequest(targetId, file);
        if (!fr.ok) toast(fr.error || "Задача сохранена, но файл прикрепить не удалось");
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={task ? "Изменить задачу" : "Новая задача"} wide
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium hover:bg-slate-50">Отмена</button>
          <button disabled={saving} onClick={submit} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700 disabled:opacity-60">
            {task ? <Check className="size-4" /> : <Plus className="size-4" />}
            {saving ? "Сохраняем…" : task ? "Сохранить" : "Создать задачу"}
          </button>
        </>
      }>
      <div className="space-y-4">
        <Field label="Название задачи" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => setTitle((v) => formatSumsInText(v))} placeholder="Название задачи" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <Field label="Клиент" required>
            <Select value={client} onChange={(e) => setClient(e.target.value)}>
              {!clientOptions.length && <option value="">Нет клиентов</option>}
              {clientOptions.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Исполнитель">
            <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              {!task && <option value="auto">Без исполнителя (статус «Новая»)</option>}
              {employeeNames.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
          <Field label="Статус">
            <Select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              {EDITABLE_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Приоритет">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </Select>
          </Field>
          <Field label="Срок">
            <Input type="date" value={dueDate ?? ""} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Описание">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} onBlur={() => setDescription((v) => formatSumsInText(v))} placeholder="Описание задачи" />
        </Field>
        {!!task?.attachments?.length && (
          <Field label="Прикреплённые файлы">
            <div className="flex flex-wrap gap-2">
              {task.attachments.map((a) => (
                <button
                  key={a.index}
                  type="button"
                  onClick={() => openTaskFile(task.id, a.index).catch(() => toast("Не удалось открыть файл"))}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[13px] font-medium text-slate-600 hover:border-brand-400 hover:text-brand-600"
                >
                  <Paperclip className="size-3.5" /> Вложение {a.index + 1}
                </button>
              ))}
            </div>
          </Field>
        )}
        <Field label="Файл или фото (необязательно)">
          <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          {!file ? (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-[13px] font-medium text-slate-500 hover:border-brand-400 hover:text-brand-600">
              <Paperclip className="size-4" /> Прикрепить файл
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px]">
              <span className="flex min-w-0 items-center gap-2">
                <Paperclip className="size-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{file.name}</span>
              </span>
              <button type="button" onClick={() => setFile(null)} className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-700">
                <X className="size-3.5" />
              </button>
            </div>
          )}
        </Field>
      </div>
    </Modal>
  );
}

/* ---------------- Быстрый просмотр задачи ---------------- */

function TaskHistory({ taskId }: { taskId: number }) {
  const [history, setHistory] = useState<LogView[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    setHistory(null);
    Promise.all([fetchLogs("telegram"), fetchLogs("crm")])
      .then(([tg, crm]) => {
        if (cancelled) return;
        const rows = [
          ...tg.filter((l) => l.num === taskId).map((l) => mapLog(l, "tg")),
          ...crm.filter((l) => l.num === taskId).map((l) => mapLog(l, "crm")),
        ].sort((a, b) => ((a.ts ?? "") < (b.ts ?? "") ? 1 : -1));
        setHistory(rows);
      })
      .catch(() => setHistory([]));
    return () => { cancelled = true; };
  }, [taskId]);

  if (history === null) {
    return <p className="py-3 text-center text-xs text-slate-400">Загружаем историю…</p>;
  }
  if (!history.length) {
    return <p className="py-3 text-center text-xs text-slate-400">По этой задаче пока нет записей в журнале.</p>;
  }
  return (
    <ul className="space-y-3 py-1">
      {history.map((l, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[12.5px]">
          <Badge tone={l.src === "tg" ? "cyan" : "purple"}>{l.src === "tg" ? "Telegram" : "CRM"}</Badge>
          <div className="min-w-0 flex-1">
            <div className="font-medium">{l.event}{l.who !== "—" && <> · {l.who}</>}</div>
            <div className="mt-0.5 text-[11px] text-slate-400">{l.time}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------------- Чат внутри задачи (YouTrack-style лента) ---------------- */

function TaskChat({ task }: { task: Task }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const thread = task.thread ?? [];
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [thread.length]);

  const send = async () => {
    const t = text.trim();
    if ((!t && !file) || sending) return;
    setSending(true);
    try {
      const r = await sendMessage(task.id, t, file);
      if (r.ok) { setText(""); setFile(null); }
      else toast(r.error || "Не удалось отправить сообщение");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <div className="mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Лента задачи</div>
      <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/60 p-3">
        {!thread.length && (
          <p className="py-4 text-center text-xs text-slate-400">
            Здесь пока пусто — оставьте комментарий, вложение или заметку по задаче.
          </p>
        )}
        {thread.map((m) => (
          <div key={m.id} className={`flex ${m.from === "staff" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-[13px] leading-snug ${
              m.from === "staff" ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
              <div className={`mb-0.5 text-[11px] font-semibold ${m.from === "staff" ? "text-brand-100" : "text-slate-400"}`}>{m.by}</div>
              {m.text && <div className="whitespace-pre-wrap">{m.text}</div>}
              {m.fileIndex != null && (
                <button type="button"
                  onClick={() => openTaskFile(task.id, m.fileIndex as number).catch(() => toast("Не удалось открыть файл"))}
                  className={`mt-1.5 flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium ${
                    m.from === "staff" ? "bg-white/15 hover:bg-white/25" : "bg-slate-100 hover:bg-slate-200"}`}>
                  <Paperclip className="size-3.5" /> Вложение
                </button>
              )}
              <div className={`mt-1 text-right text-[10px] ${m.from === "staff" ? "text-brand-100/80" : "text-slate-400"}`}>{fmtTs(m.at)}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {file && (
        <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12.5px]">
          <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
            <Paperclip className="size-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{file.name}</span>
          </span>
          <button type="button" onClick={() => setFile(null)} className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-700">
            <X className="size-3.5" />
          </button>
        </div>
      )}
      <div className="mt-2 flex items-center gap-2">
        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button type="button" onClick={() => fileInputRef.current?.click()} title="Прикрепить файл"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-brand-300 hover:text-brand-600">
          <Paperclip className="size-4" />
        </button>
        <Textarea value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
          placeholder="Комментарий по задаче…" rows={1} className="!min-h-9 flex-1 resize-none !py-2" />
        <button type="button" disabled={sending || (!text.trim() && !file)} onClick={send} title="Отправить"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40">
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* Общее тело карточки задачи — используется и в модалке быстрого
   просмотра, и на отдельной странице (/tasks/:id), чтобы не дублировать
   разметку. showOpenLink добавляет ссылку "открыть на отдельной странице"
   (её незачем показывать, когда мы уже на этой странице). */
/* Небольшое поле в боковой панели (лейбл сверху, значение снизу) —
   тот же паттерн, что в YouTrack (Project/Priority/Assignee и т.д.). */
function InfoField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">{label}</div>
      <div className="mt-1 text-[13.5px] text-slate-700">{children}</div>
    </div>
  );
}

async function copyTaskRef(task: Task) {
  const text = `№${task.id} ${task.title}`;
  try {
    await navigator.clipboard.writeText(text);
    toast("Скопировано в буфер обмена");
  } catch {
    toast("Не удалось скопировать");
  }
}

export function TaskDetailBody({ task, showOpenLink }: { task: Task; showOpenLink?: boolean }) {
  const src = sourceLabel(task);
  const thread = task.thread ?? [];
  const [tab, setTab] = useState<"chat" | "history">("chat");

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_220px]">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={() => void copyTaskRef(task)} title="Скопировать номер и название задачи"
            className="group flex items-center gap-1.5 rounded-md py-0.5 text-[13px] font-semibold text-slate-500 transition hover:text-brand-600">
            <Hash className="size-3.5" />{task.id}
            <Copy className="size-3 opacity-0 transition group-hover:opacity-100" />
          </button>
          {showOpenLink && (
            <Link to={`/tasks/${task.id}`}
              className="flex items-center gap-1 text-[12px] font-medium text-slate-400 hover:text-brand-600">
              <ExternalLink className="size-3.5" /> На отдельной странице
            </Link>
          )}
        </div>
        <h3 className="text-lg leading-snug font-bold">{task.title}</h3>
        {task.description && (
          <p className="mt-3 text-[13.5px] leading-relaxed text-slate-600">{task.description}</p>
        )}
        {!!task.attachments?.length && (
          <div className="mt-4">
            <div className="mb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Вложения</div>
            <div className="flex flex-wrap gap-2">
              {task.attachments.map((a) => (
                <button
                  key={a.index}
                  type="button"
                  onClick={() => openTaskFile(task.id, a.index).catch(() => toast("Не удалось открыть файл"))}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[13px] font-medium text-slate-600 hover:border-brand-400 hover:text-brand-600"
                >
                  <Paperclip className="size-3.5" /> Вложение {a.index + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 border-t border-slate-100 pt-1">
          <div className="flex items-center gap-1 border-b border-slate-200">
            <button type="button" onClick={() => setTab("chat")}
              className={`border-b-2 px-3 py-2 text-[13px] font-medium transition ${
                tab === "chat" ? "border-brand-600 text-brand-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
              Комментарии{thread.length ? ` · ${thread.length}` : ""}
            </button>
            <button type="button" onClick={() => setTab("history")}
              className={`border-b-2 px-3 py-2 text-[13px] font-medium transition ${
                tab === "history" ? "border-brand-600 text-brand-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
              История
            </button>
          </div>
          <div className="pt-3">
            {tab === "chat" ? <TaskChat task={task} /> : <TaskHistory taskId={task.id} />}
          </div>
        </div>
      </div>

      <aside className="space-y-4 rounded-lg border border-slate-100 bg-slate-50/60 p-3.5 md:sticky md:top-0">
        <InfoField label="Статус"><Badge tone={statusTone[displayStatus(task)]}>{displayStatus(task)}</Badge></InfoField>
        <InfoField label="Приоритет"><Badge tone={priorityTone[task.priority]}>{task.priority}</Badge></InfoField>
        {task.type === "reminder" && <InfoField label="Тип"><Badge tone="purple">напоминание</Badge></InfoField>}
        <InfoField label="Клиент">
          <span className={task.client && task.client !== "—" ? "font-medium text-brand-600" : "text-slate-400 italic"}>
            {task.client && task.client !== "—" ? task.client : "Без компании"}
          </span>
        </InfoField>
        <InfoField label="Исполнитель">
          <span className="flex items-center gap-2"><Avatar name={task.assignee} className="!size-6 !text-[10px]" />{task.assignee}</span>
        </InfoField>
        {src && <InfoField label="Источник"><Badge tone="cyan">{src}</Badge></InfoField>}
        <InfoField label="Постановщик">{task.source === "crm" ? "Создана в CRM" : task.fromBot ? "Автораспределение (Telegram)" : "Ибрагимова Юлдуз"}</InfoField>
        <InfoField label="Создана">{task.created ?? "—"}</InfoField>
        <InfoField label="Дедлайн">
          <span className={isOverdue(task) ? "font-semibold text-red-600" : ""}>
            {task.due}{isOverdue(task) ? " · просрочена" : ""}
          </span>
        </InfoField>
      </aside>
    </div>
  );
}

/* Кнопки действий над задачей — тоже общие для модалки и отдельной
   страницы. onDone — вызывается после смены статуса (модалка закрывает
   себя, страница просто остаётся на месте). */
export function TaskDetailActions({
  task, onEdit, onDelete, afterAction,
}: { task: Task; onEdit: (t: Task) => void; onDelete: (t: Task) => void; afterAction?: () => void }) {
  const isCancelled = task.status === "Отменено";
  const isDone = task.status === "Выполнена";
  return (
    <>
      {!isDone && !isCancelled && (
        <button
          onClick={() => { setTaskStatus(task.id, "Выполнена"); toast("Статус обновлён — задача выполнена"); afterAction?.(); }}
          className="mr-auto flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-emerald-700">
          <Check className="size-4" /> Выполнена
        </button>
      )}
      {!isCancelled && !isDone && (
        <button
          onClick={() => { setTaskStatus(task.id, "Отменено"); toast("Задача отменена"); afterAction?.(); }}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3.5 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50">
          <X className="size-4" /> Отменить
        </button>
      )}
      {isCancelled && (
        <button
          onClick={() => { setTaskStatus(task.id, "Новая"); toast("Задача возобновлена"); afterAction?.(); }}
          className="mr-auto flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50">
          <RotateCcw className="size-4" /> Возобновить
        </button>
      )}
      <button onClick={() => onDelete(task)}
        className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3.5 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50">
        <Trash2 className="size-4" /> Удалить
      </button>
      <button onClick={() => onEdit(task)}
        className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700">
        <Pencil className="size-4" /> Изменить
      </button>
    </>
  );
}

function TaskViewModal({
  task, onClose, onEdit, onDelete,
}: { task: Task | null; onClose: () => void; onEdit: (t: Task) => void; onDelete: (t: Task) => void }) {
  if (!task) return null;
  return (
    <Modal open onClose={onClose} title={`Задача № ${task.id}`} size="xl"
      footer={
        <TaskDetailActions
          task={task}
          onEdit={(t) => { onClose(); onEdit(t); }}
          onDelete={(t) => { onClose(); onDelete(t); }}
          afterAction={onClose}
        />
      }>
      <TaskDetailBody task={task} showOpenLink />
    </Modal>
  );
}

/* ---------------- Страница ---------------- */

export default function Tasks() {
  const tasks = useTasks();
  const employeesForFilter = useEmployees();
  useEffect(() => { void hydrateEmployees(); }, []);
  const [view, setView] = useState<"kanban" | "table">("kanban");

  const [viewTaskId, setViewTaskId] = useState<number | null>(null);
  /* Берём саму задачу из живого стора по id, а не храним снимок объекта —
     иначе после отправки сообщения в чат (или любого другого обновления
     задачи) открытая модалка продолжала бы показывать устаревшую ленту. */
  const viewTask = viewTaskId != null ? (tasks.find((t) => t.id === viewTaskId) ?? null) : null;
  const setViewTask = (t: Task | null) => setViewTaskId(t ? t.id : null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>("Новая");
  const [deleteTaskT, setDeleteTaskT] = useState<Task | null>(null);
  const [formKey, setFormKey] = useState(0);

  /* Открытие карточки задачи по ссылке из поиска в шапке (?open=<id>) */
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId || !tasks.length) return;
    const t = tasks.find((t) => t.id === Number(openId));
    if (t) setViewTaskId(t.id);
    setSearchParams((p) => { p.delete("open"); return p; }, { replace: true });
  }, [searchParams, tasks, setSearchParams]);

  const openCreate = (status: TaskStatus = "Новая") => {
    setCreateStatus(status); setFormKey((k) => k + 1); setCreateOpen(true);
  };
  const openEdit = (t: Task) => { setFormKey((k) => k + 1); setEditTask(t); };

  /* drag & drop */
  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<TaskStatus | null>(null);
  const dragTask = dragId != null ? tasks.find((t) => t.id === dragId) : null;

  const onDrop = (status: TaskStatus) => {
    if (status === "Архив") {
      toast("В архив задачи попадают автоматически — через 24ч после выполнения");
    } else if (dragTask && dragTask.status !== status) {
      setTaskStatus(dragTask.id, status);
      toast(`«${dragTask.title.slice(0, 40)}${dragTask.title.length > 40 ? "…" : ""}» → ${status}`);
    }
    setDragId(null); setOverCol(null);
  };

  /* фильтры таблицы */
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("Все статусы");
  const [fPrio, setFPrio] = useState("Любой приоритет");
  const [fAssignee, setFAssignee] = useState("Все исполнители");

  const filtered = useMemo(() => tasks.filter((t) =>
    (t.title + t.client + t.id).toLowerCase().includes(q.toLowerCase()) &&
    (fStatus === "Все статусы" || t.status === fStatus) &&
    (fPrio === "Любой приоритет" || t.priority === fPrio) &&
    (fAssignee === "Все исполнители" || t.assignee === fAssignee)
  ), [tasks, q, fStatus, fPrio, fAssignee]);

  const active = tasks.filter((t) => t.status === "Новая" || t.status === "В работе").length;
  const overdue = tasks.filter(isOverdue).length;
  const done = tasks.filter((t) => t.status === "Выполнена").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Задачи</h1>
          <p className="mt-0.5 text-sm text-slate-500">{active} активных · {overdue} просроченных · {done} выполнено</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {([["kanban", "Канбан", Kanban], ["table", "Таблица", LayoutList]] as const).map(([v, label, Icon]) => (
              <button key={v} onClick={() => setView(v)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition ${
                  view === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
          <button onClick={() => openCreate()}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700">
            <Plus className="size-4" /> Создать задачу
          </button>
        </div>
      </div>

      {/* ---------- КАНБАН ---------- */}
      {view === "kanban" && (
        <div className="grid grid-cols-5 items-start gap-2.5 pb-2 max-lg:grid-cols-[repeat(5,240px)] max-lg:overflow-x-auto">
          {columns.map(({ status, dot, ring }) => {
            const items = tasks.filter((t) => displayStatus(t) === status);
            const isOver = overCol === status && dragTask?.status !== status;
            return (
              <div key={status}
                onDragOver={(e) => { e.preventDefault(); setOverCol(status); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null); }}
                onDrop={(e) => { e.preventDefault(); onDrop(status); }}
                className={`min-w-0 rounded-xl p-2 ring-2 transition-all ${
                  isOver ? `${ring} ring-inset` : "bg-slate-100/70 ring-transparent"}`}>
                <div className="flex items-center gap-2 px-1.5 pb-2.5 text-[13px] font-semibold">
                  <span className={`size-2 rounded-full ${dot}`} />
                  {status}
                  <span className="rounded-full bg-white px-2 py-px text-[11px] font-semibold text-slate-400 shadow-sm">{items.length}</span>
                  {status !== "Архив" && (
                    <button onClick={() => openCreate(status)}
                      className="ml-auto rounded-md p-1 text-slate-400 transition hover:bg-white hover:text-slate-700" title="Добавить сюда">
                      <Plus className="size-3.5" />
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {items.map((t) => {
                    const src = sourceLabel(t);
                    return (
                      <Card key={t.id}
                        draggable
                        onDragStart={(e) => { setDragId(t.id); e.dataTransfer.effectAllowed = "move"; }}
                        onDragEnd={() => { setDragId(null); setOverCol(null); }}
                        onClick={() => setViewTask(t)}
                        className={`cursor-grab border-l-[3px] p-3 transition select-none active:cursor-grabbing ${prioBorder[t.priority]} ${
                          dragId === t.id ? "rotate-1 opacity-40 shadow-lg" : "hover:-translate-y-0.5 hover:shadow-md"}`}>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                          <Hash className="size-3" />{t.id}
                          {t.type === "reminder" && <Badge tone="cyan">напоминание</Badge>}
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-[13px] leading-snug font-semibold">{t.title}</div>
                        <div className="mt-1 truncate text-xs text-slate-400">{t.client}</div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className={`flex items-center gap-1.5 text-[11px] ${isOverdue(t) ? "font-semibold text-red-500" : "text-slate-400"}`}>
                            {status === "Архив" ? <Archive className="size-3" />
                              : status === "Выполнена" ? <Check className="size-3 text-emerald-500" />
                              : status === "Отменено" ? <X className="size-3 text-red-500" />
                              : <Calendar className="size-3" />}
                            {t.due}
                            {src === "из Telegram" && <Send className="size-3 text-cyan-500" />}
                          </span>
                          <Avatar name={t.assignee} className="!size-6 !text-[10px]" />
                        </div>
                      </Card>
                    );
                  })}
                  {isOver && <div className="h-16 rounded-lg border-2 border-dashed border-current opacity-30" />}
                  {!items.length && !isOver && (
                    <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                      Перетащите задачу сюда
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------- ТАБЛИЦА ---------- */}
      {view === "table" && (
        <Card>
          <div className="flex flex-wrap gap-2.5 border-b border-slate-200 p-4">
            <div className="relative min-w-56 flex-1 max-w-xs">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по названию, клиенту" className="!pl-9" />
            </div>
            <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="!w-auto">
              <option>Все статусы</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
            </Select>
            <Select value={fPrio} onChange={(e) => setFPrio(e.target.value)} className="!w-auto">
              <option>Любой приоритет</option>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </Select>
            <Select value={fAssignee} onChange={(e) => setFAssignee(e.target.value)} className="!w-auto">
              <option>Все исполнители</option>{employeesForFilter.map((e) => <option key={e.id}>{e.name}</option>)}
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  <th className="px-4 py-3">Название</th>
                  <th className="px-4 py-3">Клиент</th>
                  <th className="px-4 py-3">Исполнитель</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Приоритет</th>
                  <th className="px-4 py-3">Дедлайн</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => {
                  const src = sourceLabel(t);
                  return (
                    <tr key={t.id} onClick={() => setViewTask(t)} className="cursor-pointer transition-colors hover:bg-slate-50">
                      <td className="max-w-sm px-4 py-3">
                        <div className="truncate font-semibold">{t.title}</div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Hash className="size-3" />{t.id}{src && <> · {src}</>}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{t.client}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-2"><Avatar name={t.assignee} className="!size-6 !text-[10px]" />{t.assignee}</span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {displayStatus(t) === "Архив" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 py-1 pr-3 pl-3 text-xs font-medium text-slate-500">
                            Архив
                          </span>
                        ) : (
                          <select
                            value={t.status}
                            onChange={(e) => { setTaskStatus(t.id, e.target.value as TaskStatus); toast("Статус обновлён — клиент уведомлён"); }}
                            className={`cursor-pointer rounded-full border py-1 pr-7 pl-3 text-xs font-medium focus:outline-none ${
                              { "Новая": "border-violet-200 bg-violet-50 text-violet-700",
                                "В работе": "border-brand-200 bg-brand-50 text-brand-700",
                                "Выполнена": "border-emerald-200 bg-emerald-50 text-emerald-700",
                                "Отменено": "border-red-200 bg-red-50 text-red-700" }[t.status as "Новая" | "В работе" | "Выполнена" | "Отменено"]}`}>
                            {EDITABLE_STATUSES.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3"><Badge tone={priorityTone[t.priority]}>{t.priority}</Badge></td>
                      <td className={`px-4 py-3 whitespace-nowrap ${isOverdue(t) ? "font-semibold text-red-600" : ""}`}>{t.due}</td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Menu trigger={
                          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                            <MoreHorizontal className="size-4" />
                          </button>
                        }>
                          <MenuItem icon={<ExternalLink className="size-4" />} onClick={() => setViewTask(t)}>Открыть</MenuItem>
                          <MenuItem icon={<Pencil className="size-4" />} onClick={() => openEdit(t)}>Изменить</MenuItem>
                          {displayStatus(t) === "Архив" || t.status === "Отменено" ? (
                            <MenuItem icon={<RotateCcw className="size-4" />} onClick={() => { setTaskStatus(t.id, "В работе"); toast("Задача возобновлена — статус «В работе»"); }}>Возобновить</MenuItem>
                          ) : (
                            <>
                              {t.status !== "Выполнена" && (
                                <MenuItem icon={<Check className="size-4" />} onClick={() => { setTaskStatus(t.id, "Выполнена"); toast("Задача отмечена выполненной"); }}>Выполнена</MenuItem>
                              )}
                              <MenuItem icon={<X className="size-4" />} onClick={() => { setTaskStatus(t.id, "Отменено"); toast("Задача отменена"); }}>Отменить</MenuItem>
                            </>
                          )}
                          <MenuDivider />
                          <MenuItem danger icon={<Trash2 className="size-4" />} onClick={() => setDeleteTaskT(t)}>Удалить</MenuItem>
                        </Menu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!filtered.length && (
              <div className="p-12 text-center">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Search className="size-5" /></div>
                <div className="font-semibold">Задачи не найдены</div>
                <p className="mt-1 text-[13px] text-slate-400">Измените условия поиска или создайте новую задачу.</p>
              </div>
            )}
          </div>
          <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
            Показано {filtered.length} из {tasks.length} задач
          </div>
        </Card>
      )}

      {/* ---------- Модалки ---------- */}
      <TaskViewModal task={viewTask} onClose={() => setViewTask(null)} onEdit={openEdit} onDelete={setDeleteTaskT} />
      {createOpen && <TaskFormModal key={`c${formKey}`} open onClose={() => setCreateOpen(false)} defaultStatus={createStatus} />}
      {editTask && <TaskFormModal key={`e${formKey}`} open onClose={() => setEditTask(null)} task={editTask} />}
      <ConfirmModal
        open={!!deleteTaskT}
        onClose={() => setDeleteTaskT(null)}
        onConfirm={async () => {
          if (!deleteTaskT) return;
          const r = await deleteTaskEverywhere(deleteTaskT.id);
          toast(r.ok ? "Задача удалена из системы" : (r.error === "forbidden" ? "Удаление доступно только супер-админу" : (r.error || "Не удалось удалить задачу")));
        }}
        title="Удалить задачу?"
        text="Это действие нельзя отменить. Все связанные комментарии и файлы будут также удалены."
        icon={<Trash2 className="size-5" />}
      />
    </div>
  );
}
