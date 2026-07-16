import { useEffect, useState } from "react";
import { Bot, FileText, MessageSquareText, RefreshCw, Sparkles, Tags, Wand2, Zap } from "lucide-react";
import { Badge, Card, CardHeader, Toggle, toast } from "../components/ui";
import { aiClassify, fetchAiPing, fetchAiSettings, saveAiSettings, type AiSettings } from "../api";

const FEATURES: { key: keyof AiSettings; icon: typeof Tags; title: string; desc: string }[] = [
  { key: "classify", icon: Tags, title: "Классификация заявок", desc: "Свободные заявки из бота автоматически получают категорию и подкатегорию — сразу видно в группе и CRM" },
  { key: "drafts", icon: FileText, title: "Черновики операций", desc: "Из текста заявки ИИ готовит структурированный черновик (контрагент, сумма, назначение) — бухгалтер проверяет и проводит через Didox" },
  { key: "summarize", icon: MessageSquareText, title: "Суммаризация переписки", desc: "Краткая выжимка длинных обращений клиента в карточке задачи" },
];

const AUTONOMY: { key: keyof AiSettings; icon: typeof Zap; title: string; desc: string } = {
  key: "autoWork", icon: Zap,
  title: "Автономный ИИ-бухгалтер",
  desc: "Как только приходит новая заявка (из бота или CRM), ИИ сам берёт её в работу: готовит черновик и создаёт непроведённый документ в 1С. Если не уверен — задаёт уточняющий вопрос реплаем в группе бухгалтеров и ждёт ответа. Обо всём отчитывается в группе и в чате задачи.",
};

export default function IntegrationAI() {
  const [ping, setPing] = useState<{ ok: boolean; key: boolean; model: string; error?: string } | null>(null);
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [testing, setTesting] = useState(false);
  const [probe, setProbe] = useState("");
  const [probeRes, setProbeRes] = useState<string | null>(null);

  useEffect(() => {
    fetchAiPing().then(setPing).catch(() => setPing({ ok: false, key: false, model: "?", error: "Мост AI недоступен" }));
    fetchAiSettings().then((r) => setSettings(r.settings)).catch(() => setSettings({ classify: true, drafts: true, summarize: true, autoWork: false }));
  }, []);

  const toggle = async (key: keyof AiSettings) => {
    if (!settings) return;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    const r = await saveAiSettings(next);
    toast(r.ok ? "Сохранено" : r.error || "Не удалось сохранить");
  };

  const liveTest = async () => {
    setTesting(true);
    try {
      const r = await fetchAiPing(true);
      setPing(r);
      toast(r.ok ? `Модель ${r.model} отвечает` : r.error || "Модель не отвечает");
    } finally { setTesting(false); }
  };

  const runProbe = async () => {
    if (!probe.trim()) return;
    setProbeRes("…");
    try {
      const r = await aiClassify(probe);
      setProbeRes(r.ok && r.result ? `${r.result.category}${r.result.sub ? " → " + r.result.sub : ""}` : r.error || "не распознано (низкая уверенность)");
    } catch { setProbeRes("ошибка запроса"); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI-интеграция</h1>
        <p className="mt-0.5 text-sm text-slate-500">Автоматизация бухгалтерских операций до этапа отправки — ИИ готовит, бухгалтер проводит</p>
      </div>

      <Card>
        <CardHeader title="Подключение" action={
          ping === null ? <Badge tone="gray">проверяем…</Badge>
            : ping.ok ? <Badge tone="green">активно</Badge>
            : ping.key ? <Badge tone="yellow">ключ есть, ошибка вызова</Badge>
            : <Badge tone="gray">ключ не задан</Badge>
        } />
        <div className="space-y-3 p-5 text-[13.5px]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">API-ключ (OpenAI)</div>
              <div className="text-xs text-slate-400">Переменная OPENAI_API_KEY в Vercel (проект finpulse-crm) — в браузер не передаётся</div>
            </div>
            <Badge tone={ping?.key ? "green" : "gray"}>{ping?.key ? "задан" : "не задан"}</Badge>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div>
              <div className="font-medium">Модель</div>
              <div className="text-xs text-slate-400">Меняется переменной OPENAI_MODEL</div>
            </div>
            <span className="font-mono text-[12.5px] text-slate-600">{ping?.model ?? "…"}</span>
          </div>
          {ping?.error && <div className="rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] text-amber-700">{ping.error}</div>}
          <div className="flex justify-end border-t border-slate-100 pt-3">
            <button onClick={liveTest} disabled={testing || !ping?.key}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-[13px] font-medium hover:bg-slate-50 disabled:opacity-40">
              <RefreshCw className={`size-4 ${testing ? "animate-spin" : ""}`} /> Проверить модель
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Функции" action={<Sparkles className="size-4 text-slate-400" />} />
        <div className="divide-y divide-slate-100">
          {FEATURES.map((f) => (
            <div key={f.key} className="flex items-center gap-4 px-5 py-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <f.icon className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold">{f.title}</div>
                <div className="mt-0.5 text-[12.5px] leading-relaxed text-slate-500">{f.desc}</div>
              </div>
              <Toggle checked={!!settings?.[f.key]} onChange={() => toggle(f.key)} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Автономность" action={<AUTONOMY.icon className="size-4 text-slate-400" />} />
        <div className="flex items-center gap-4 px-5 py-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <AUTONOMY.icon className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold">{AUTONOMY.title}</div>
            <div className="mt-0.5 text-[12.5px] leading-relaxed text-slate-500">{AUTONOMY.desc}</div>
          </div>
          <Toggle checked={!!settings?.autoWork} onChange={() => toggle("autoWork")} />
        </div>
        {settings?.autoWork && (
          <div className="border-t border-amber-100 bg-amber-50 px-5 py-3 text-[12.5px] text-amber-700">
            Включено: ИИ будет самостоятельно создавать непроведённые документы в 1С по новым заявкам без подтверждения на каждый шаг. Проверяйте карточки в 1С перед проведением.
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Проверка классификации" action={<Wand2 className="size-4 text-slate-400" />} />
        <div className="space-y-3 p-5">
          <textarea value={probe} onChange={(e) => setProbe(e.target.value)} rows={2}
            placeholder="Вставьте текст заявки клиента, например: «нужно оплатить счёт от СнабТорг на 4 500 000 сум до пятницы»"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13.5px] focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none" />
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-slate-500">{probeRes && <>Результат: <b>{probeRes}</b></>}</span>
            <button onClick={runProbe} disabled={!ping?.key || !probe.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700 disabled:opacity-40">
              Классифицировать
            </button>
          </div>
        </div>
        <div className="flex items-start gap-2.5 border-t border-slate-100 px-5 py-3.5 text-[12.5px] text-slate-500">
          <Bot className="mt-0.5 size-4 shrink-0 text-slate-400" />
          {settings?.autoWork
            ? "ИИ создаёт документы в 1С сам (при включённой автономности выше), но всегда НЕПРОВЕДЁННЫМИ — провести и отправить может только бухгалтер."
            : "ИИ никогда не проводит операции сам — только классифицирует и готовит черновики для проверки бухгалтером."}
        </div>
      </Card>
    </div>
  );
}
