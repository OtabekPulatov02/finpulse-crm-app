import { useMemo, useState } from "react";
import {
  Calendar, Check, ExternalLink, Hash, Kanban, LayoutList, MoreHorizontal,
  Pencil, Plus, RotateCcw, Search, Send, Trash2, X,
} from "lucide-react";
import {
  Avatar, Badge, Card, ConfirmModal, Field, Input, Menu, MenuDivider,
  MenuItem, Modal, Select, Textarea, toast,
} from "../components/ui";
import {
  CLIENT_NAMES, EMPLOYEE_NAMES, PRIORITIES, STATUSES,
  priorityTone, statusTone, type Priority, type Task, type TaskStatus,
} from "../data/demo";
import { addTask, removeTask, setTaskStatus, updateTask, useTasks } from "../store/tasks";

/* ---------------- Вспомогательное ---------------- */

const columns: { status: TaskStatus; dot: string; ring: string }[] = [
  { status: "Новая", dot: "bg-violet-500", ring: "ring-violet-300 bg-violet-50/60" },
  { status: "В работе", dot: "bg-brand-500", ring: "ring-brand-300 bg-brand-50/60" },
  { status: "Выполнена", dot: "bg-emerald-500", ring: "ring-emerald-300 bg-emerald-50/60" },
  { status: "Отменена", dot: "bg-slate-400", ring: "ring-slate-300 bg-slate-100/80" },
];

const prioBorder: Record<Priority, string> = {
  "Низкий": "border-l-slate-300",
  "Средний": "border-l-brand-500",
  "Высокий": "border-l-amber-500",
  "Критический": "border-l-red-500",
};

function isOverdue(t: Task): boolean {
  if (t.status === "Выполнена" || t.status === "Отменена") return false;
  const m = t.due.match(/^(\d{2})\.(\d{2})/);
  if (!m) return false;
  const now = new Date();
  return new Date(now.getFullYear(), +m[2] - 1, +m[1]) < new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function sourceLabel(t: Task) {
  if (t.fromBot) return "из Telegram";
  if (t.fromCalendar) return "из календаря";
  return null;
}

/* ---------------- Форма задачи (создание/изменение) ---------------- */

function TaskFormModal({
  open, onClose, task, defaultStatus,
}: { open: boolean; onClose: () => void; task?: Task | null; defaultStatus?: TaskStatus }) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [client, setClient] = useState(task?.client ?? CLIENT_NAMES[1]);
  const [assignee, setAssignee] = useState(task?.assignee ?? "auto");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus ?? "Новая");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "Средний");
  const [due, setDue] = useState(task?.due ?? "20.07");
  const [description, setDescription] = useState(task?.description ?? "");

  const submit = () => {
    if (!title.trim()) { toast("Укажите название задачи"); return; }
    const assigneeFinal = assignee === "auto" ? EMPLOYEE_NAMES[0] : assignee;
    if (task) {
      updateTask(task.id, { title, client, assignee: assigneeFinal, status, priority, due, description });
      toast("Изменения сохранены — история задачи дополнена");
    } else {
      addTask({ title, client, assignee: assigneeFinal, status, priority, due, description, created: "сегодня" });
      toast(assignee === "auto" ? "Задача создана и распределена автоматически" : "Задача создана и назначена исполнителю");
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={task ? "Изменить задачу" : "Новая задача"} wide
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium hover:bg-slate-50">Отмена</button>
          <button onClick={submit} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700">
            {task ? <Check className="size-4" /> : <Plus className="size-4" />}
            {task ? "Сохранить" : "Создать задачу"}
          </button>
        </>
      }>
      <div className="space-y-4">
        <Field label="Название задачи" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название задачи" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <Field label="Клиент" required>
            <Select value={client} onChange={(e) => setClient(e.target.value)}>
              {CLIENT_NAMES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Исполнитель">
            <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              {!task && <option value="auto">Назначить автоматически</option>}
              {EMPLOYEE_NAMES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
          <Field label="Статус">
            <Select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Приоритет">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </Select>
          </Field>
          <Field label="Дедлайн">
            <Input value={due} onChange={(e) => setDue(e.target.value)} placeholder="ДД.ММ" />
          </Field>
        </div>
        <Field label="Описание">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание задачи" />
        </Field>
      </div>
    </Modal>
  );
}

/* ---------------- Быстрый просмотр задачи ---------------- */

function TaskViewModal({
  task, onClose, onEdit, onDelete,
}: { task: Task | null; onClose: () => void; onEdit: (t: Task) => void; onDelete: (t: Task) => void }) {
  if (!task) return null;
  const src = sourceLabel(task);
  return (
    <Modal open onClose={onClose} title={`Задача № ${task.id}`} wide
      footer={
        <>
          {task.status !== "Выполнена" && task.status !== "Отменена" && (
            <button
              onClick={() => { setTaskStatus(task.id, "Выполнена"); toast("Статус обновлён — задача выполнена"); onClose(); }}
              className="mr-auto flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-emerald-700">
              <Check className="size-4" /> Выполнена
            </button>
          )}
          <button onClick={() => { onClose(); onDelete(task); }}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3.5 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50">
            <Trash2 className="size-4" /> Удалить
          </button>
          <button onClick={() => { onClose(); onEdit(task); }}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700">
            <Pencil className="size-4" /> Изменить
          </button>
        </>
      }>
      <div className="mb-3 flex flex-wrap gap-2">
        <Badge tone={statusTone[task.status]}>{task.status}</Badge>
        <Badge tone={priorityTone[task.priority]}>{task.priority} приоритет</Badge>
        {src && <Badge tone="cyan">{src}</Badge>}
        {isOverdue(task) && <Badge tone="red">просрочена</Badge>}
      </div>
      <h3 className="text-lg leading-snug font-bold">{task.title}</h3>
      {task.description && (
        <p className="mt-3 text-[13.5px] leading-relaxed text-slate-600">{task.description}</p>
      )}
      <dl className="mt-5 grid grid-cols-[130px_1fr] gap-x-4 gap-y-2.5 border-t border-slate-100 pt-4 text-[13.5px]">
        <dt className="text-slate-400">Клиент</dt>
        <dd className="font-medium text-brand-600">{task.client}</dd>
        <dt className="text-slate-400">Исполнитель</dt>
        <dd className="flex items-center gap-2"><Avatar name={task.assignee} className="!size-6 !text-[10px]" />{task.assignee}</dd>
        <dt className="text-slate-400">Постановщик</dt>
        <dd>{task.fromBot ? "Автораспределение (Telegram)" : "Ибрагимова Юлдуз"}</dd>
        <dt className="text-slate-400">Создана</dt>
        <dd>{task.created ?? "—"}</dd>
        <dt className="text-slate-400">Дедлайн</dt>
        <dd className={`font-semibold ${isOverdue(task) ? "text-red-600" : ""}`}>{task.due}</dd>
      </dl>
    </Modal>
  );
}

/* ---------------- Страница ---------------- */

export default function Tasks() {
  const tasks = useTasks();
  const [view, setView] = useState<"kanban" | "table">("kanban");

  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>("Новая");
  const [deleteTaskT, setDeleteTaskT] = useState<Task | null>(null);
  const [formKey, setFormKey] = useState(0);

  const openCreate = (status: TaskStatus = "Новая") => {
    setCreateStatus(status); setFormKey((k) => k + 1); setCreateOpen(true);
  };
  const openEdit = (t: Task) => { setFormKey((k) => k + 1); setEditTask(t); };

  /* drag & drop */
  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<TaskStatus | null>(null);
  const dragTask = dragId != null ? tasks.find((t) => t.id === dragId) : null;

  const onDrop = (status: TaskStatus) => {
    if (dragTask && dragTask.status !== status) {
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
        <div className="grid grid-cols-4 items-start gap-3.5 overflow-x-auto pb-2 max-xl:grid-cols-[repeat(4,270px)]">
          {columns.map(({ status, dot, ring }) => {
            const items = tasks.filter((t) => t.status === status);
            const isOver = overCol === status && dragTask?.status !== status;
            return (
              <div key={status}
                onDragOver={(e) => { e.preventDefault(); setOverCol(status); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null); }}
                onDrop={(e) => { e.preventDefault(); onDrop(status); }}
                className={`min-w-64 rounded-xl p-2.5 ring-2 transition-all ${
                  isOver ? `${ring} ring-inset` : "bg-slate-100/70 ring-transparent"}`}>
                <div className="flex items-center gap-2 px-1.5 pb-2.5 text-[13px] font-semibold">
                  <span className={`size-2 rounded-full ${dot}`} />
                  {status}
                  <span className="rounded-full bg-white px-2 py-px text-[11px] font-semibold text-slate-400 shadow-sm">{items.length}</span>
                  <button onClick={() => openCreate(status)}
                    className="ml-auto rounded-md p-1 text-slate-400 transition hover:bg-white hover:text-slate-700" title="Добавить сюда">
                    <Plus className="size-3.5" />
                  </button>
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
                        <div className="line-clamp-2 text-[13px] leading-snug font-semibold">{t.title}</div>
                        <div className="mt-1 truncate text-xs text-slate-400">{t.client}</div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className={`flex items-center gap-1.5 text-[11px] ${isOverdue(t) ? "font-semibold text-red-500" : "text-slate-400"}`}>
                            {status === "Выполнена" ? <Check className="size-3 text-emerald-500" />
                              : status === "Отменена" ? <X className="size-3" />
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
              <option>Все исполнители</option>{EMPLOYEE_NAMES.map((n) => <option key={n}>{n}</option>)}
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
                        <select
                          value={t.status}
                          onChange={(e) => { setTaskStatus(t.id, e.target.value as TaskStatus); toast("Статус обновлён — клиент уведомлён"); }}
                          className={`cursor-pointer rounded-full border py-1 pr-7 pl-3 text-xs font-medium focus:outline-none ${
                            { "Новая": "border-violet-200 bg-violet-50 text-violet-700",
                              "В работе": "border-brand-200 bg-brand-50 text-brand-700",
                              "Выполнена": "border-emerald-200 bg-emerald-50 text-emerald-700",
                              "Отменена": "border-slate-200 bg-slate-100 text-slate-500" }[t.status]}`}>
                          {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
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
                          {t.status === "Отменена" ? (
                            <MenuItem icon={<RotateCcw className="size-4" />} onClick={() => { setTaskStatus(t.id, "Новая"); toast("Задача возобновлена — статус «Новая»"); }}>Возобновить</MenuItem>
                          ) : t.status !== "Выполнена" && (
                            <MenuItem icon={<Check className="size-4" />} onClick={() => { setTaskStatus(t.id, "Выполнена"); toast("Задача отмечена выполненной"); }}>Выполнена</MenuItem>
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
        onConfirm={() => { if (deleteTaskT) { removeTask(deleteTaskT.id); toast("Задача удалена из системы"); } }}
        title="Удалить задачу?"
        text="Это действие нельзя отменить. Все связанные комментарии и файлы будут также удалены."
        icon={<Trash2 className="size-5" />}
      />
    </div>
  );
}
