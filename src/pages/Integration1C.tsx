import { useEffect, useState } from "react";
import { Activity, ArrowLeftRight, CheckCircle2, CloudOff, Database, RefreshCw, RefreshCwOff } from "lucide-react";
import { Badge, Card, CardHeader, toast } from "../components/ui";
import { fetch1cDoclog, fetch1cPing, fetch1cReports, sync1cContracts, sync1cCounterparties, sync1cNomenclature, sync1cOrgs, sync1cReports, type App1C, type Doc1cLogItem, type Report1cItem } from "../api";

/* Маппинг реквизитов 1С («Организации», БУ УЗ 3.0) → поля карточки клиента CRM */
const FIELD_MAP: [string, string][] = [
  ["Сокращённое наименование", "Название компании (company)"],
  ["Полное наименование", "fullName"],
  ["ИНН", "inn"],
  ["ПИНФЛ", "pinfl"],
  ["Рег. код плательщика НДС", "vatCode"],
  ["Система налогообложения", "taxSystem"],
  ["Банк (осн. счёт)", "bank"],
  ["МФО", "mfo"],
  ["Номер счёта", "bankAccount"],
  ["Адрес", "address"],
  ["Директор (подписи)", "director"],
  ["Налоговая инспекция", "taxOffice"],
];

export default function Integration1C() {
  const [apps, setApps] = useState<App1C[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [doclog, setDoclog] = useState<Doc1cLogItem[] | null>(null);
  const [reports, setReports] = useState<Report1cItem[] | null>(null);
  const [reportsNote, setReportsNote] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch1cPing()
      .then((r) => { if (r.ok && r.apps) { setApps(r.apps); setErr(null); } else setErr(r.error || "Нет ответа"); })
      .catch(() => setErr("Мост 1С недоступен"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);
  useEffect(() => {
    fetch1cDoclog(30).then((r) => { if (r.ok) setDoclog(r.items ?? []); }).catch(() => {});
  }, []);
  const loadReports = () => {
    fetch1cReports().then((r) => { if (r.ok) { setReports(r.items ?? []); setReportsNote(r.note ?? null); } }).catch(() => {});
  };
  useEffect(loadReports, []);

  const doSync = async (a: App1C) => {
    setSyncing(a.code);
    try {
      const r = await sync1cOrgs(a.code);
      if (r.ok) toast(`«${a.name}»: организаций ${r.total ?? 0}, новых карточек ${r.created ?? 0}, обновлено ${r.updated ?? 0}`);
      else toast(r.error || "Синхронизация не удалась");
    } finally { setSyncing(null); }
  };

  /* контрагенты и их договоры синкаются вместе одной кнопкой — договор без контрагента бессмыслен,
     а раздельные кнопки только загромождали бы таблицу */
  const doSyncCp = async (a: App1C) => {
    setSyncing(a.code);
    try {
      const r = await sync1cCounterparties(a.code);
      const rc = await sync1cContracts(a.code);
      if (r.ok) toast(`«${a.name}»: контрагентов ${r.mapped ?? 0} из ${r.total ?? 0}` + (rc.ok ? `, договоров ${rc.total ?? 0}` : ""));
      else toast(r.error || "Синхронизация не удалась");
    } finally { setSyncing(null); }
  };

  const doSyncNom = async (a: App1C) => {
    setSyncing(a.code);
    try {
      const r = await sync1cNomenclature(a.code);
      if (r.ok) toast(`«${a.name}»: номенклатуры сопоставлено ${r.mapped ?? 0} из ${r.total ?? 0}`);
      else toast(r.error || "Синхронизация не удалась");
    } finally { setSyncing(null); }
  };

  const doSyncReports = async (a: App1C) => {
    setSyncing(a.code);
    try {
      const r = await sync1cReports(a.code);
      if (r.ok) { toast(`«${a.name}»: видов отчётности ${r.types ?? 0} из ${r.total ?? 0} записей`); loadReports(); }
      else toast(r.error || "Синхронизация не удалась");
    } finally { setSyncing(null); }
  };

  const doSyncAll = async () => {
    const targets = (apps ?? []).filter((a) => a.ready);
    if (!targets.length) { toast("Нет баз, готовых к синку"); return; }
    setSyncingAll(true);
    let ok = 0, failed = 0, created = 0, updated = 0;
    try {
      for (const a of targets) {
        setSyncing(a.code);
        try {
          const r = await sync1cOrgs(a.code);
          if (r.ok) { ok++; created += r.created ?? 0; updated += r.updated ?? 0; }
          else failed++;
        } catch { failed++; }
      }
      toast(`Синк всех баз: ${ok} успешно${failed ? `, ${failed} с ошибкой` : ""} · новых карточек ${created}, обновлено ${updated}`);
    } finally { setSyncing(null); setSyncingAll(false); }
  };

  const readyCount = apps?.filter((a) => a.ready).length ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Интеграция с 1С</h1>
        <p className="mt-0.5 text-sm text-slate-500">Clobus.uz (1С:Фреш) · Бухгалтерия для Узбекистана 3.0 · абонент 6366</p>
      </div>

      {err && (
        <Card className="border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-start gap-3">
            <CloudOff className="mt-0.5 size-[18px] shrink-0 text-amber-600" />
            <div className="text-[13px] leading-relaxed text-amber-800">
              <b>{err}.</b> Для активации нужно: 1) письмо в поддержку Clobus о включении состава OData;
              2) пользователь <code className="rounded bg-amber-100 px-1">crm_api</code> в базах 1С;
              3) переменные <code className="rounded bg-amber-100 px-1">ODATA_1C_LOGIN / ODATA_1C_PASSWORD</code> в Vercel.
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title={`Базы (${apps?.length ?? 0})`} action={
          <div className="flex items-center gap-3">
            {apps && <span className="text-xs text-slate-400">{readyCount} из {apps.length} готовы к обмену</span>}
            <button onClick={doSyncAll} disabled={!readyCount || syncingAll || !!syncing}
              className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-[12.5px] font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-40">
              {syncingAll ? <RefreshCwOff className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              {syncingAll ? "Синхронизация всех…" : "Синк всех организаций"}
            </button>
            <button onClick={load} disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] font-medium hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> Проверить
            </button>
          </div>
        } />
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold tracking-wider text-slate-400 uppercase">
                <th className="px-4 py-3">База</th>
                <th className="px-4 py-3">Код</th>
                <th className="px-4 py-3">OData</th>
                <th className="px-4 py-3">Объектов</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(apps ?? []).map((a) => (
                <tr key={a.code} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-semibold"><Database className="size-4 text-slate-400" />{a.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{a.code}</td>
                  <td className="px-4 py-3">
                    {a.ready
                      ? <Badge tone="green">готов</Badge>
                      : a.reachable
                        ? <Badge tone="yellow">состав пуст</Badge>
                        : <Badge tone="gray">{a.status === 401 ? "401: логин/пароль" : a.status === 403 ? "403: нет прав" : a.status ? `ошибка ${a.status}` : "нет соединения"}</Badge>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{a.entities ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <button
                        onClick={() => doSync(a)}
                        disabled={!a.ready || syncing === a.code}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] font-medium hover:bg-slate-50 disabled:opacity-40">
                        {syncing === a.code ? "…" : "Синк организаций"}
                      </button>
                      <button
                        onClick={() => doSyncCp(a)}
                        disabled={!a.ready || syncing === a.code}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] font-medium hover:bg-slate-50 disabled:opacity-40">
                        {syncing === a.code ? "…" : "Синк контрагентов"}
                      </button>
                      <button
                        onClick={() => doSyncNom(a)}
                        disabled={!a.ready || syncing === a.code}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] font-medium hover:bg-slate-50 disabled:opacity-40">
                        {syncing === a.code ? "…" : "Синк номенклатуры"}
                      </button>
                      <button
                        onClick={() => doSyncReports(a)}
                        disabled={!a.ready || syncing === a.code}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] font-medium hover:bg-slate-50 disabled:opacity-40">
                        {syncing === a.code ? "…" : "Синк отчётности"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!apps && !err && <div className="p-8 text-center text-sm text-slate-400">Проверяем доступность баз…</div>}
        </div>
      </Card>

      <Card>
        <CardHeader title="Документы, созданные ИИ в 1С" action={<Database className="size-4 text-slate-400" />} />
        {doclog && doclog.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2 font-medium">Задача</th>
                  <th className="px-4 py-2 font-medium">Компания</th>
                  <th className="px-4 py-2 font-medium">Тип</th>
                  <th className="px-4 py-2 font-medium">Контрагент</th>
                  <th className="px-4 py-2 font-medium">Сумма</th>
                  <th className="px-4 py-2 font-medium">№ документа</th>
                  <th className="px-4 py-2 font-medium">Когда</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doclog.map((d) => (
                  <tr key={d.ref} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-500">№{d.num}</td>
                    <td className="px-4 py-2 font-medium">{d.company}</td>
                    <td className="px-4 py-2 text-slate-500">{d.type}</td>
                    <td className="px-4 py-2 text-slate-500">{d.counterparty || "—"}</td>
                    <td className="px-4 py-2 text-slate-500">{d.amount ? d.amount.toLocaleString("ru-RU") : "—"}</td>
                    <td className="px-4 py-2 text-slate-500">{d.number || d.ref.slice(0, 8)}</td>
                    <td className="px-4 py-2 text-slate-400">{new Date(d.at).toLocaleString("ru-RU")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-400">Пока нет документов, созданных ИИ</div>
        )}
      </Card>

      <Card>
        <CardHeader title="Календарь регламентированной отчётности" action={<Activity className="size-4 text-slate-400" />} />
        {reports && reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2 font-medium">Отчёт</th>
                  <th className="px-4 py-2 font-medium">Компания</th>
                  <th className="px-4 py-2 font-medium">Периодичность</th>
                  <th className="px-4 py-2 font-medium">Последний период</th>
                  <th className="px-4 py-2 font-medium">Ожидаемый следующий</th>
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium">{r.name}</td>
                    <td className="px-4 py-2 text-slate-500">{r.appName}</td>
                    <td className="px-4 py-2 text-slate-500">{r.periodicity}</td>
                    <td className="px-4 py-2 text-slate-500">{r.lastPeriodLabel}</td>
                    <td className="px-4 py-2 text-slate-500">{new Date(r.nextExpectedPeriodEnd).toLocaleDateString("ru-RU")}</td>
                    <td className="px-4 py-2">
                      {r.periodsSkipped > 0 && <Badge tone="yellow">давно не готовили ({r.periodsSkipped})</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-400">Пока нет данных — нажмите «Синк отчётности» у нужной базы выше</div>
        )}
        <div className="flex items-start gap-2.5 border-t border-slate-100 px-5 py-3.5 text-[12.5px] text-slate-500">
          <CloudOff className="mt-0.5 size-4 shrink-0 text-slate-400" />
          {reportsNote || "Это ориентир, выведенный из истории и периодичности отчёта в 1С — НЕ официальный срок сдачи (1С его не хранит отдельным полем). Всегда сверяйте с реальным законодательным сроком."}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <Card>
          <CardHeader title="Маппинг полей: 1С → CRM" action={<ArrowLeftRight className="size-4 text-slate-400" />} />
          <div className="divide-y divide-slate-100">
            {FIELD_MAP.map(([from, to]) => (
              <div key={to} className="flex items-center justify-between gap-4 px-5 py-2.5 text-[13px]">
                <span className="text-slate-600">{from}</span>
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[12px] text-slate-700">{to}</code>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Дорожная карта обмена" action={<Activity className="size-4 text-slate-400" />} />
          <div className="space-y-3 p-5 text-[13px] leading-relaxed text-slate-600">
            {[
              ["готово", "Мост /api/1c: пинг баз, чтение и синк организаций, контрагентов, договоров и номенклатуры"],
              ["готово", "Автономный ИИ-бухгалтер: черновики + непроведённые документы из заявок бота/CRM с проверкой контрагента по ИНН/названию (см. настройки AI)"],
              ["готово", "Обороты по счёту за период (без разбивки по контрагентам — не публикуется через OData в этой конфигурации)"],
              ["ждём Clobus", "PRESTIGE CLUB: включение состава OData поддержкой (ошибка 404) — заявка в поддержку отправлена"],
              ["невозможно", "Чтение входящих документов ЭДО/Didox и напоминаний/задач бухгалтера из 1С — соответствующие сущности не публикуются через OData в этой конфигурации"],
              ["готово", "Календарь регламентированной отчётности: последний подготовленный период по каждому виду отчёта + ориентировочный следующий (выведено из истории, не официальный срок из 1С)"],
              ["дальше", "Разбивка задолженности по контрагентам, если Clobus когда-нибудь откроет субконто через OData"],
            ].map(([tag, text], i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className={`mt-0.5 size-4 shrink-0 ${tag === "готово" ? "text-emerald-500" : tag === "ждём Clobus" ? "text-amber-500" : tag === "невозможно" ? "text-rose-400" : "text-slate-300"}`} />
                <span><b className="text-slate-700">{tag}:</b> {text}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
