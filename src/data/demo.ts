import type { Tone } from "../components/ui";

export type TaskStatus = "Новая" | "В работе" | "Выполнена" | "Отменена";
export type Priority = "Низкий" | "Средний" | "Высокий" | "Критический";

export const STATUSES: TaskStatus[] = ["Новая", "В работе", "Выполнена", "Отменена"];
export const PRIORITIES: Priority[] = ["Низкий", "Средний", "Высокий", "Критический"];

export const statusTone: Record<TaskStatus, Tone> = {
  "Новая": "purple", "В работе": "blue", "Выполнена": "green", "Отменена": "gray",
};
export const priorityTone: Record<Priority, Tone> = {
  "Низкий": "gray", "Средний": "blue", "Высокий": "yellow", "Критический": "red",
};

export interface Task {
  id: number;
  title: string;
  client: string;
  assignee: string;
  status: TaskStatus;
  priority: Priority;
  due: string;
  fromBot?: boolean;
  fromCalendar?: boolean;
  description?: string;
  created?: string;
}

export const initialTasks: Task[] = [
  { id: 1247, title: "Подготовить декларацию по НДС за II квартал", client: "ООО «ТехноСфера»", assignee: "Елена Крылова", status: "В работе", priority: "Высокий", due: "25.07", fromBot: true, created: "02.07.2026, 14:02", description: "Клиент получил уведомление о необходимости сдачи декларации по НДС за II квартал 2026 года. Необходимо: собрать первичные документы, проверить книги покупок и продаж, сверить входящий НДС со счетами-фактурами поставщиков, сформировать декларацию и отправить на согласование клиенту не позднее 23 июля." },
  { id: 1252, title: "Ответ на требование ИФНС № 14-08/2214", client: "ООО «СтройГарант»", assignee: "Ольга Никитина", status: "Новая", priority: "Критический", due: "10.07", created: "06.07.2026, 09:15" },
  { id: 1244, title: "Начислить зарплату за июнь", client: "АО «ВекторПлюс»", assignee: "Анна Смирнова", status: "В работе", priority: "Средний", due: "06.07", created: "01.07.2026, 08:40" },
  { id: 1249, title: "Акт сверки с поставщиком «ФармОпт»", client: "ООО «МедФарм»", assignee: "Дмитрий Орлов", status: "В работе", priority: "Средний", due: "15.07", fromBot: true, created: "03.07.2026, 12:47" },
  { id: 1253, title: "Кадровые документы для нового сотрудника", client: "ООО «Логистик Групп»", assignee: "Игорь Васильев", status: "Новая", priority: "Низкий", due: "14.07", fromBot: true, created: "06.07.2026, 09:15" },
  { id: 1256, title: "Проверка авансового отчёта", client: "ООО «АгроТрейд»", assignee: "Елена Крылова", status: "Новая", priority: "Средний", due: "17.07", created: "07.07.2026, 11:20" },
  { id: 1250, title: "Первичные документы за июнь", client: "ИП Соколова А. В.", assignee: "Дмитрий Орлов", status: "В работе", priority: "Средний", due: "12.07", created: "04.07.2026, 10:02" },
  { id: 1251, title: "Сверка расчётов с ИФНС", client: "ООО «ТехноСфера»", assignee: "Игорь Васильев", status: "Новая", priority: "Средний", due: "18.07", created: "05.07.2026, 16:44" },
  { id: 1255, title: "Оплатить аренду офиса (12 000 000 сум)", client: "ООО «ТехноСфера»", assignee: "Елена Крылова", status: "Новая", priority: "Средний", due: "15.07", fromCalendar: true, created: "01.07.2026, 00:00" },
  { id: 1240, title: "6-НДФЛ за полугодие", client: "ООО «МедФарм»", assignee: "Дмитрий Орлов", status: "Выполнена", priority: "Высокий", due: "03.07", created: "25.06.2026, 13:10" },
  { id: 1242, title: "Выставить счета за июнь", client: "ИП Соколова А. В.", assignee: "Дмитрий Орлов", status: "Выполнена", priority: "Средний", due: "05.07", created: "28.06.2026, 15:31" },
  { id: 1218, title: "Переход на электронный документооборот", client: "ИП Соколова А. В.", assignee: "Дмитрий Орлов", status: "Отменена", priority: "Низкий", due: "—", created: "10.06.2026, 12:00" },
];

export interface Client {
  name: string; inn: string; tax: string; contact: string; phone: string;
  manager: string; status: "Активный" | "Новый" | "Из бота" | "В архиве"; activeTasks: number;
}

export const clients: Client[] = [
  { name: "MCHJ «Барака Транс»", inn: "—", tax: "—", contact: "Шахзод Каримов", phone: "+998 90 123-45-67", manager: "не назначен", status: "Из бота", activeTasks: 1 },
  { name: "ООО «ТехноСфера»", inn: "7701234567", tax: "УСН", contact: "Павел Литвинов", phone: "+998 71 120-45-67", manager: "Елена Крылова", status: "Активный", activeTasks: 6 },
  { name: "ИП Соколова А. В.", inn: "772034567890", tax: "Патент", contact: "Алина Соколова", phone: "+998 90 733-20-18", manager: "Дмитрий Орлов", status: "Активный", activeTasks: 2 },
  { name: "ООО «СтройГарант»", inn: "5027098765", tax: "ОСНО", contact: "Сергей Мельник", phone: "+998 71 640-88-31", manager: "Ольга Никитина", status: "Активный", activeTasks: 4 },
  { name: "АО «ВекторПлюс»", inn: "7802345671", tax: "ОСНО", contact: "Марина Ковалёва", phone: "+998 71 305-12-90", manager: "Анна Смирнова", status: "Активный", activeTasks: 5 },
  { name: "ООО «Логистик Групп»", inn: "7734567012", tax: "УСН", contact: "Артём Данилов", phone: "+998 71 971-54-02", manager: "Дмитрий Орлов", status: "Новый", activeTasks: 3 },
  { name: "ООО «МедФарм»", inn: "7716009843", tax: "УСН", contact: "Наталья Григорьева", phone: "+998 71 258-70-44", manager: "Елена Крылова", status: "Активный", activeTasks: 4 },
];

export const CLIENT_NAMES = clients.filter((c) => c.status !== "В архиве").map((c) => c.name);

export const employees = [
  { name: "Елена Крылова", load: 85 },
  { name: "Дмитрий Орлов", load: 64 },
  { name: "Анна Смирнова", load: 92 },
  { name: "Игорь Васильев", load: 41 },
  { name: "Ольга Никитина", load: 58 },
];

export const EMPLOYEE_NAMES = employees.map((e) => e.name);
