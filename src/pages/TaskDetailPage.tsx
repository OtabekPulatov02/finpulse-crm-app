import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, ConfirmModal, toast } from "../components/ui";
import { deleteTaskEverywhere, useTasks } from "../store/tasks";
import type { Task } from "../data/demo";
import { TaskDetailActions, TaskDetailBody, TaskFormModal } from "./Tasks";

/* Задача на отдельной странице — та же информация, что и в модалке
   быстрого просмотра (см. TaskDetailBody/TaskDetailActions в Tasks.tsx),
   просто в полноэкранном виде. Полезно, когда нужно поделиться прямой
   ссылкой на задачу или работать с ней дольше, чем удобно в модалке. */
export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tasks = useTasks();
  const task = tasks.find((t) => t.id === Number(id)) ?? null;

  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTaskT, setDeleteTaskT] = useState<Task | null>(null);
  const [formKey, setFormKey] = useState(0);

  if (!task) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate("/tasks")}
          className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-brand-600">
          <ArrowLeft className="size-4" /> К списку задач
        </button>
        <Card className="p-8 text-center text-sm text-slate-400">
          Задача не найдена — возможно, она была удалена, либо страница ещё загружается.
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/tasks")}
        className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-brand-600">
        <ArrowLeft className="size-4" /> К списку задач
      </button>
      <Card className="mx-auto max-w-4xl p-5">
        <TaskDetailBody task={task} />
        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <TaskDetailActions
            task={task}
            onEdit={(t) => { setFormKey((k) => k + 1); setEditTask(t); }}
            onDelete={(t) => setDeleteTaskT(t)}
          />
        </div>
      </Card>

      {editTask && (
        <TaskFormModal key={`e${formKey}`} open onClose={() => setEditTask(null)} task={editTask} />
      )}
      <ConfirmModal
        open={!!deleteTaskT}
        onClose={() => setDeleteTaskT(null)}
        onConfirm={async () => {
          if (!deleteTaskT) return;
          const r = await deleteTaskEverywhere(deleteTaskT.id);
          toast(r.ok ? "Задача удалена из системы" : (r.error === "forbidden" ? "Удаление доступно только супер-админу" : (r.error || "Не удалось удалить задачу")));
          if (r.ok) navigate("/tasks");
        }}
        title="Удалить задачу?"
        text="Это действие нельзя отменить. Все связанные комментарии и файлы будут также удалены."
      />
    </div>
  );
}
