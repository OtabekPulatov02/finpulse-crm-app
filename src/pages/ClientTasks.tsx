import { useEffect, useRef, useState } from "react";
import { Hash, Kanban, LayoutList, Paperclip, Pencil, Plus, X } from "lucide-react";
import { Field, Input, Modal, Textarea, toast } from "../components/ui";
import {
  attachTaskFileRequest, createTaskRequest, fetchBotTasks, fmtTs, openTaskFile, updateTaskRequest, type BotTask,
} from "../api";
import { formatSumsInText } from "../lib/amount";

const STATUS_LABEL: Record<BotTask["status"], string> = {
  new: "Новая", in_progress: "В работе", done: "Выполнена",
};
const STATUS_TONE: Record<BotTask["status"], string> = {
  new: "bg-violet-50 text-violet-600 border-violet-200",
  in_progress: "bg-brand-50 text-brand-600 border-brand-200",
  done: "bg-emerald-50 text-emerald-600 border-emerald-200",
};
const COLUMNS: { status: BotTask["status"]; dot: string }[] = [
  { status: "new", dot: "bg-violet-500" },
  { status: "in_progress", dot: "bg-brand-500" },
  { status: "done", dot: "bg-emerald-500" },
];

function StatusBadge({ status }: { status: BotTask["status"] }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_TONE[status]}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

/* Форма создания/редактирования задачи клиентом. Статус здесь всегда
   только для просмотра — клиент не может его менять или переносить
   карточку между колонками канбана, только следить за прогрессом.
   Можно приложить файл/скриншот — он уходит в тот же Telegram-канал,
   что и вложения из бота. */
function TaskFormModal({
  open, onClose, task, onSaved,
}: { open: boolean; onClose: () => void; task?: BotTask | null; onSaved: (t: BotTask) => void }) {
  const edit = !!task;
  const [text, setText] = useState(task?.text ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(task?.text ?? "");
    setDueDate(task?.dueDate ?? "");
    setFile(null);
  }, [task, open]);

  async function submit() {
    if (!text.trim()) { toast("Опишите задачу текстом"); return; }
    setSaving(true);
    try {
      let saved: BotTask | null = null;
      if (edit && task) {
        const r = await updateTaskRequest(task.num, { text: text.trim(), dueDate: dueDate || null });
        if (!r.ok || !r.task) { toast(r.error || "Не удалось сохранить изменения"); return; }
        saved = r.task;
      } else {
        const r = await createTaskRequest({ text: text.trim(), dueDate: dueDate || undefined });
        if (!r.ok || !r.task) { toast(r.error || "Не удалось создать задачу"); return; }
        saved = r.task;
      }
      if (file && saved) {
        const fr = await attachTaskFileRequest(saved.num, file);
        if (fr.ok && fr.task) saved = fr.task;
        else toast(fr.error || "Задача сохранена, но файл прикрепить не удалось");
      }
      toast(edit ? "Задача обновлена" : "Задача создана — бухгалтер получит её и назначит исполнителя");
      onSaved(saved);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={edit ? `Задача №${task?.num}` : "Новая задача"}
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium hover:bg-slate-50">Отмена</button>
          <button disabled={saving} onClick={submit}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700 disabled:opacity-60">
            <Plus className="size-4" /> {saving ? "Сохраняем…" : edit ? "Сохранить" : "Создать задачу"}
          </button>
        </>
      }>
      <div className="space-y-4">
        {edit && task && (
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[13px]">
            <span className="text-slate-500">Статус (меняет бухгалтер)</span>
            <StatusBadge status={task.status} />
          </div>
        )}
        <Field label="Описание задачи" required>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} onBlur={() => setText((v) => formatSumsInText(v))} placeholder="Что нужно сделать?" rows={5} />
        </Field>
        <Field label="Желаемый срок (необязательно)">
          <Input type="date" value={dueDate ?? ""} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
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
          {edit && task && !!task.attachments?.length && (
            <div className="mt-2 flex flex-wrap gap-2">
              {task.attachments.map((a) => (
                <button
                  key={a.index}
                  type="button"
                  onClick={() => openTaskFile(task.num, a.index).catch(() => {})}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[13px] font-medium text-slate-600 hover:border-brand-400 hover:text-brand-600"
                >
                  <Paperclip className="size-3.5" /> Вложение {a.index + 1}
                </button>
              ))}
            </div>
          )}
        </Field>
      </div>
    </Modal>
  );
}

export default function ClientTasks() {
  const [tasks, setTasks] = useState<BotTask[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<BotTask | null>(null);

  function reload() {
    fetchBotTasks()
      .then((t) => setTasks(t))
      .catch(() => setError("Не удалось загрузить задачи. Попробуйте обновить страницу."));
  }

  useEffect(() => { reload(); }, []);

  function onSaved(t: BotTask) {
    setTasks((prev) => {
      if (!prev) return [t];
      const exists = prev.some((x) => x.num === t.num);
      return exists ? prev.map((x) => (x.num === t.num ? t : x)) : [t, ...prev];
    });
  }

  function openCreate() { setEditTask(null); setFormOpen(true); }
  function openEdit(t: BotTask) { setEditTask(t); setFormOpen(true); }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Мои задачи</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Статусы обновляются автоматически, как только бухгалтер берёт задачу в работу или завершает её.
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700">
          <Plus className="size-4" /> Новая задача
        </button>
      </div>

      <div className="flex gap-1.5 rounded-lg bg-slate-100 p-1 max-w-max">
        {([["kanban", "Канбан", Kanban], ["list", "Список", LayoutList]] as const).map(([v, label, Icon]) => (
          <button key={v} onClick={() => setView(v)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition ${
              view === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600">{error}</div>
      )}

      {tasks === null && !error && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">Загрузка…</div>
      )}

      {tasks !== null && tasks.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
          Пока нет задач. Нажмите «Новая задача» или напишите боту Finpulse в Telegram.
        </div>
      )}

      {/* ---------- КАНБАН (только просмотр статуса — без перетаскивания) ---------- */}
      {tasks !== null && tasks.length > 0 && view === "kanban" && (
        <div className="grid grid-cols-3 gap-3.5 overflow-x-auto pb-2 max-xl:grid-cols-[repeat(3,300px)]">
          {COLUMNS.map(({ status, dot }) => {
            const items = tasks.filter((t) => t.status === status);
            return (
              <div key={status} className="min-w-64 rounded-xl bg-slate-100/70 p-2.5">
                <div className="flex items-center gap-2 px-1.5 pb-2.5 text-[13px] font-semibold">
                  <span className={`size-2 rounded-full ${dot}`} />
                  {STATUS_LABEL[status]}
                  <span className="rounded-full bg-white px-2 py-px text-[11px] font-semibold text-slate-400 shadow-sm">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((t) => (
                    <div key={t.num} onClick={() => openEdit(t)}
                      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition select-none hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                        <Hash className="size-3" />{t.num}
                      </div>
                      <div className="mt-0.5 line-clamp-3 text-[13px] leading-snug">{t.text}</div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{t.dueDate ? `до ${t.dueDate}` : fmtTs(t.createdAt)}</span>
                        {t.files > 0 && <span className="flex items-center gap-1"><Paperclip className="size-3" /> {t.files}</span>}
                      </div>
                    </div>
                  ))}
                  {!items.length && (
                    <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">Пусто</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------- СПИСОК ---------- */}
      {tasks !== null && tasks.length > 0 && view === "list" && (
        <div className="space-y-3">
          {tasks.map((t) => (
            <div key={t.num} onClick={() => openEdit(t)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="mb-1.5 flex items-start justify-between gap-3">
                <div className="text-sm font-medium text-slate-900">№{t.num}</div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.status} />
                  <Pencil className="size-3.5 text-slate-300" />
                </div>
              </div>
              <div className="mb-2 text-[13.5px] leading-snug text-slate-700">{t.text}</div>
              <div className="flex items-center gap-3 text-[12px] text-slate-400">
                <span>{fmtTs(t.createdAt)}</span>
                {t.dueDate && <span>· срок {t.dueDate}</span>}
                {t.assignee && <span>· Исполнитель: {t.assignee}</span>}
                {t.files > 0 && (
                  <span className="flex items-center gap-1"><Paperclip className="size-3" /> {t.files}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskFormModal open={formOpen} onClose={() => setFormOpen(false)} task={editTask} onSaved={onSaved} />
    </div>
  );
}
