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
  { id: 1247, title: "Подготовить отчёт по НДС за июнь и сдать через soliq.uz", client: "ООО «ТехноСфера»", assignee: "Елена Крылова", status: "В работе", priority: "Высокий", due: "20.07", fromBot: true, created: "02.07.2026, 14:02", description: "Клиент получил уведомление ГНИ о сдаче отчёта по НДС за июнь 2026. Необходимо: проверить входящие и исходящие ЭСФ в Didox, сверить книгу покупок и продаж, сформировать отчёт в кабинете soliq.uz и отправить клиенту на согласование до 18 июля. Ставка НДС 12%." },
  { id: 1252, title: "Ответ на требование ГНИ № 30-05/1187 по налогу с оборота", client: "ООО «СтройГарант»", assignee: "Ольга Никитина", status: "Новая", priority: "Критический", due: "10.07", created: "06.07.2026, 09:15", description: "ГНИ Яккасарайского района запросила пояснения по расхождению выручки в отчёте по налогу с оборота за I полугодие. Срок ответа — 3 рабочих дня." },
  { id: 1244, title: "Начислить зарплату, ИНПС и соцналог за июнь", client: "АО «ВекторПлюс»", assignee: "Анна Смирнова", status: "В работе", priority: "Средний", due: "10.07", created: "01.07.2026, 08:40", description: "Начислить зарплату по табелю за июнь (42 сотрудника), удержать НДФЛ 12% и ИНПС 0,1%, начислить соцналог, подготовить платёжки в банк-клиенте." },
  { id: 1249, title: "Акт сверки с поставщиком «ФармОпт» за I полугодие", client: "ООО «МедФарм»", assignee: "Дмитрий Орлов", status: "В работе", priority: "Средний", due: "15.07", fromBot: true, created: "03.07.2026, 12:47" },
  { id: 1253, title: "Кадровые документы для нового сотрудника (приём с 15.07)", client: "ООО «Логистик Групп»", assignee: "Игорь Васильев", status: "Новая", priority: "Низкий", due: "14.07", fromBot: true, created: "06.07.2026, 09:15", description: "Оформить приказ о приёме, трудовой договор, внести запись в my.mehnat.uz, поставить на учёт в ИНПС." },
  { id: 1256, title: "Проверка авансового отчёта командировки в Бухару", client: "MCHJ «Andijon Agro Servis»", assignee: "Елена Крылова", status: "Новая", priority: "Средний", due: "17.07", created: "07.07.2026, 11:20" },
  { id: 1250, title: "Обработать первичные документы за июнь (накладные, ЭСФ)", client: "ИП Соколова А. В.", assignee: "Дмитрий Орлов", status: "В работе", priority: "Средний", due: "12.07", created: "04.07.2026, 10:02" },
  { id: 1251, title: "Сверка расчётов с бюджетом по лицевому счёту ГНИ", client: "ООО «ТехноСфера»", assignee: "Игорь Васильев", status: "Новая", priority: "Средний", due: "18.07", created: "05.07.2026, 16:44" },
  { id: 1255, title: "Оплатить аренду офиса — 12 000 000 сум", client: "ООО «ТехноСфера»", assignee: "Елена Крылова", status: "Новая", priority: "Средний", due: "15.07", fromCalendar: true, created: "01.07.2026, 00:00", description: "Ежемесячный платёж по договору аренды № 14-А. Создано автоматически из календаря платежей." },
  { id: 1246, title: "Выставить ЭСФ покупателям через Didox (12 шт.)", client: "OOO «Buxoro Tekstil»", assignee: "Анна Смирнова", status: "Новая", priority: "Высокий", due: "11.07", created: "06.07.2026, 15:20" },
  { id: 1243, title: "Статистическая форма 1-КБ за июнь (stat.uz)", client: "АО «ВекторПлюс»", assignee: "Ольга Никитина", status: "В работе", priority: "Низкий", due: "16.07", created: "02.07.2026, 09:05" },
  { id: 1240, title: "Отчёт по НДФЛ и соцналогу за II квартал", client: "ООО «МедФарм»", assignee: "Дмитрий Орлов", status: "Выполнена", priority: "Высокий", due: "03.07", created: "25.06.2026, 13:10" },
  { id: 1242, title: "Выставить счета за услуги июня", client: "ИП Соколова А. В.", assignee: "Дмитрий Орлов", status: "Выполнена", priority: "Средний", due: "05.07", created: "28.06.2026, 15:31" },
  { id: 1239, title: "Продлить ЭЦП директора (истекает 20.07)", client: "OOO «Samarqand Logistics»", assignee: "Игорь Васильев", status: "Выполнена", priority: "Средний", due: "06.07", created: "27.06.2026, 10:12" },
  { id: 1237, title: "Инвентаризация основных средств за полугодие", client: "ООО «СтройГарант»", assignee: "Ольга Никитина", status: "Выполнена", priority: "Низкий", due: "30.06", created: "20.06.2026, 09:00" },
  { id: 1218, title: "Переход на электронный документооборот (Didox)", client: "ИП Соколова А. В.", assignee: "Дмитрий Орлов", status: "Отменена", priority: "Низкий", due: "—", created: "10.06.2026, 12:00", description: "Клиент решил остаться на бумажном документообороте до конца года." },
];

export interface Client {
  name: string; inn: string; tax: string; contact: string; phone: string;
  manager: string; status: "Активный" | "Новый" | "Из бота" | "В архиве"; activeTasks: number;
}

export const clients: Client[] = [
  { name: "MCHJ «Барака Транс»", inn: "—", tax: "—", contact: "Шахзод Каримов", phone: "+998 90 *** ** 67", manager: "не назначен", status: "Из бота", activeTasks: 1 },
  { name: "ООО «ТехноСфера»", inn: "301245876", tax: "НДС 12%", contact: "Павел Литвинов", phone: "+998 71 120-45-67", manager: "Елена Крылова", status: "Активный", activeTasks: 6 },
  { name: "ИП Соколова А. В.", inn: "521048733", tax: "Налог с оборота 4%", contact: "Алина Соколова", phone: "+998 90 733-20-18", manager: "Дмитрий Орлов", status: "Активный", activeTasks: 2 },
  { name: "ООО «СтройГарант»", inn: "302876590", tax: "НДС 12%", contact: "Сергей Мельник", phone: "+998 71 640-88-31", manager: "Ольга Никитина", status: "Активный", activeTasks: 4 },
  { name: "АО «ВекторПлюс»", inn: "200934812", tax: "НДС 12%", contact: "Марина Ковалёва", phone: "+998 71 305-12-90", manager: "Анна Смирнова", status: "Активный", activeTasks: 5 },
  { name: "ООО «Логистик Групп»", inn: "306518274", tax: "Налог с оборота 4%", contact: "Артём Данилов", phone: "+998 71 971-54-02", manager: "Дмитрий Орлов", status: "Новый", activeTasks: 3 },
  { name: "ООО «МедФарм»", inn: "304761098", tax: "НДС 12%", contact: "Наталья Григорьева", phone: "+998 71 258-70-44", manager: "Елена Крылова", status: "Активный", activeTasks: 4 },
  { name: "OOO «Buxoro Tekstil»", inn: "305412687", tax: "НДС 12%", contact: "Дилшод Рахимов", phone: "+998 65 223-14-55", manager: "Анна Смирнова", status: "Активный", activeTasks: 3 },
  { name: "MCHJ «Andijon Agro Servis»", inn: "307985123", tax: "Налог с оборота 4%", contact: "Нодира Юсупова", phone: "+998 74 228-90-12", manager: "Елена Крылова", status: "Активный", activeTasks: 2 },
  { name: "OOO «Samarqand Logistics»", inn: "308174569", tax: "НДС 12%", contact: "Бахтиёр Тошев", phone: "+998 66 233-70-81", manager: "Игорь Васильев", status: "Новый", activeTasks: 1 },
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
