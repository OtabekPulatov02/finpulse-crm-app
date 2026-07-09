import { Activity, Copy, Database, Eye, Send } from "lucide-react";
import { Badge, Card, CardHeader, Toggle, toast } from "../components/ui";

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-[12.5px] tracking-wide focus:border-brand-500 focus:outline-none";

function MaskedRow({ label, value, hint, secret }: { label: string; value: string; hint?: string; secret?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium">{label}</label>
      <div className="flex gap-2">
        <input type={secret ? "password" : "text"} value={value} readOnly className={inp} />
        {secret && (
          <button onClick={() => toast("Просмотр доступен только супер-админу")} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><Eye className="size-4" /></button>
        )}
        <button onClick={() => toast("Скопировано в буфер обмена")} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><Copy className="size-4" /></button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function Integrations() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Интеграции</h1>
        <p className="mt-0.5 text-sm text-slate-500">Telegram-бот и база данных</p>
      </div>

      <div className="grid grid-cols-2 items-start gap-4 max-xl:grid-cols-1">
        <Card>
          <CardHeader
            title="Telegram-бот"
            action={<Badge tone="green">Подключён</Badge>}
          />
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium">Название бота</label>
                <input defaultValue="Finpulse · Бухгалтерия" className={inp.replace("font-mono ", "")} />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium">Username</label>
                <input defaultValue="@finpulse_crm_bot" className={inp.replace("font-mono ", "")} />
              </div>
            </div>
            <MaskedRow label="Токен бота" value="0000000000:XXXXXXXXXXXXXXXXXXXXXXXX" secret hint="Выдаётся в @BotFather. При смене — обновите переменную и webhook." />
            <MaskedRow label="Webhook URL" value="https://finpulse-crm.vercel.app/api/bot" />
            <MaskedRow label="Код привязки группы" value="finpulse2026" secret />
            <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
              <span className="text-[13px] font-medium">Уведомлять группу о новых задачах</span>
              <Toggle />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[13px] font-medium">Уведомлять клиента о смене статуса</span>
              <Toggle />
            </div>
          </div>
          <div className="flex justify-between border-t border-slate-200 px-5 py-4">
            <button onClick={() => toast("getMe: @finpulse_crm_bot · webhook активен")} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-[13px] font-medium hover:bg-slate-50"><Activity className="size-4" />Проверить</button>
            <button onClick={() => toast("Настройки бота сохранены")} className="rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700">Сохранить</button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="База данных · Redis" action={<Badge tone="green">Подключена</Badge>} />
            <div className="space-y-4 p-5">
              <MaskedRow label="REST URL" value="https://xxxxxx.upstash.io" secret />
              <MaskedRow label="REST Token" value="AXXXXXXXXXXXXXXXXXXXXXX" secret />
              <div className="rounded-lg border border-brand-200 bg-brand-50 p-3.5 text-xs leading-relaxed text-brand-700">
                <Database className="mb-1 size-4" />
                Ключи задаются в Vercel → Environment Variables. После изменения нужен повторный деплой.
                Не удаляйте ключи <b>task:*</b> и <b>user:*</b> — это активные данные.
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-200 px-5 py-4">
              <button onClick={() => toast("PING → PONG · 14 мс")} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-[13px] font-medium hover:bg-slate-50"><Activity className="size-4" />Проверить соединение</button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Переменные окружения" action={<Badge tone="gray">Vercel</Badge>} />
            <div className="divide-y divide-slate-100">
              {["TELEGRAM_BOT_TOKEN", "BIND_CODE", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"].map((v) => (
                <div key={v} className="flex items-center justify-between px-5 py-3">
                  <span className="font-mono text-[12.5px] font-medium">{v}</span>
                  <Badge tone="green">Задана</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <p className="flex items-center gap-2 text-xs text-slate-400"><Send className="size-3.5" />Бот работает в репозитории finpulse-crm — API переедет сюда на этапе подключения БД.</p>
    </div>
  );
}
