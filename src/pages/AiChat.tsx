import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, Trash2, Wrench } from "lucide-react";
import { Card } from "../components/ui";
import { aiAgent, type AgentMessage, type AgentStep } from "../api";

interface ChatItem { role: "user" | "assistant"; content: string; steps?: AgentStep[] }

const SUGGESTIONS = [
  "Сколько активных задач и у кого больше всего просрочек?",
  "Покажи клиентов, превысивших лимит операций",
  "Создай задачу для Phoenix Systems: подготовить акт сверки до пятницы",
  "Проверь доступность баз 1С",
];

export default function AiChat() {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [items, busy]);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput("");
    const next: ChatItem[] = [...items, { role: "user", content: q }];
    setItems(next);
    setBusy(true);
    try {
      const history: AgentMessage[] = next.map((i) => ({ role: i.role, content: i.content }));
      const r = await aiAgent(history);
      setItems([...next, { role: "assistant", content: r.ok ? r.reply : (r.error || "Ошибка агента"), steps: r.steps }]);
    } catch {
      setItems([...next, { role: "assistant", content: "Не удалось связаться с агентом — проверьте OPENAI_API_KEY и деплой." }]);
    } finally { setBusy(false); }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI-чат</h1>
          <p className="mt-0.5 text-sm text-slate-500">Оперирует всем CRM: задачи, клиенты, тарифы, настройки бота, 1С · только супер-админ</p>
        </div>
        {items.length > 0 && (
          <button onClick={() => setItems([])} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] font-medium text-slate-500 hover:bg-slate-50">
            <Trash2 className="size-3.5" /> Очистить
          </button>
        )}
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {!items.length && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><Sparkles className="size-6" /></span>
              <div className="text-[13.5px] text-slate-500">Поручите задачу — агент сам прочитает данные и выполнит действия.<br />Деструктивные операции он выполняет только после вашего подтверждения.</div>
              <div className="flex max-w-lg flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)}
                    className="rounded-full border border-slate-200 px-3.5 py-1.5 text-[12.5px] text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {items.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${m.role === "user" ? "" : "flex gap-2.5"}`}>
                {m.role === "assistant" && (
                  <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600"><Bot className="size-4" /></span>
                )}
                <div>
                  {m.steps && m.steps.length > 0 && (
                    <div className="mb-1.5 flex flex-wrap gap-1.5">
                      {m.steps.map((st, si) => (
                        <span key={si} title={st.args}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${st.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-600"}`}>
                          <Wrench className="size-2.5" />{st.tool}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap ${
                    m.role === "user" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                    {m.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-full bg-violet-50 text-violet-600"><Bot className="size-4" /></span>
              <span className="flex gap-1">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="size-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d}ms` }} />
                ))}
              </span>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="flex gap-2 border-t border-slate-200 p-3.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
            placeholder="Например: переведи задачу №106 в «Выполнена» и сообщи клиенту…"
            disabled={busy}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-[13.5px] focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none disabled:opacity-60"
          />
          <button onClick={() => void send()} disabled={busy || !input.trim()}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40">
            <Send className="size-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}
