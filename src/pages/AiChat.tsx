import { useEffect, useRef, useState } from "react";
import { Bot, MessageSquarePlus, Send, Sparkles, Trash2, Wrench } from "lucide-react";
import { Card } from "../components/ui";
import {
  aiAgent, deleteAiChat, fetchAiChat, fetchAiChats,
  type AgentMessage, type AgentStep, type AiChatMeta,
} from "../api";

interface ChatItem { role: "user" | "assistant"; content: string; steps?: AgentStep[] }

function renderInline(text: string, keyPrefix: string) {
  const parts: (string | JSX.Element)[] = [];
  const regex = /\*\*(.+?)\*\*|`(.+?)`/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = regex.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] !== undefined) parts.push(<strong key={`${keyPrefix}-b${k++}`}>{m[1]}</strong>);
    else if (m[2] !== undefined) parts.push(<code key={`${keyPrefix}-c${k++}`} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[12px]">{m[2]}</code>);
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MessageContent({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trimStart();
        const isBullet = /^[-*]\s+/.test(trimmed);
        const content = isBullet ? trimmed.replace(/^[-*]\s+/, "") : line;
        return (
          <span key={i} className={isBullet ? "flex gap-1.5" : undefined}>
            {isBullet && <span className="select-none">•</span>}
            <span>{renderInline(content, String(i))}</span>
            {i < lines.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}

const SUGGESTIONS = [
  "Сколько активных задач и у кого больше всего просрочек?",
  "Покажи клиентов, превысивших лимит операций",
  "Создай задачу для Phoenix Systems: подготовить акт сверки до пятницы",
  "Проверь доступность баз 1С",
];

function fmtWhen(iso: string) {
  const d = new Date(iso);
  if (isNaN(+d)) return "";
  const today = new Date();
  return d.toDateString() === today.toDateString()
    ? d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

export default function AiChat() {
  const [chats, setChats] = useState<AiChatMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [items, busy]);
  useEffect(() => { fetchAiChats().then(setChats).catch(() => {}); }, []);

  const openChat = async (id: string) => {
    setActiveId(id);
    setItems([]);
    try { setItems(await fetchAiChat(id)); } catch { /* noop */ }
  };

  const newChat = () => { setActiveId(null); setItems([]); setInput(""); };

  const removeChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteAiChat(id).catch(() => {});
    setChats((s) => s.filter((c) => c.id !== id));
    if (activeId === id) newChat();
  };

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput("");
    const next: ChatItem[] = [...items, { role: "user", content: q }];
    setItems(next);
    setBusy(true);
    try {
      const history: AgentMessage[] = next.map((i) => ({ role: i.role, content: i.content }));
      const r = await aiAgent(history, activeId);
      setItems([...next, { role: "assistant", content: r.ok ? r.reply : (r.error || "Ошибка агента"), steps: r.steps }]);
      if (r.chatId) {
        setActiveId(r.chatId);
        fetchAiChats().then(setChats).catch(() => {});
      }
    } catch {
      setItems([...next, { role: "assistant", content: "Не удалось связаться с агентом — проверьте OPENAI_API_KEY и деплой." }]);
    } finally { setBusy(false); }
  };

  return (
    <div className="flex h-[calc(100vh-7.5rem)] gap-4">
      {/* Темы */}
      <Card className="flex w-60 shrink-0 flex-col max-md:hidden">
        <div className="p-3">
          <button onClick={newChat}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-[13px] font-medium text-white hover:bg-brand-700">
            <MessageSquarePlus className="size-4" /> Новый диалог
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
          {!chats.length && <div className="px-2 pt-4 text-center text-xs text-slate-400">История диалогов появится здесь</div>}
          {chats.map((c) => (
            <div key={c.id} onClick={() => openChat(c.id)}
              className={`group flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] transition ${
                activeId === c.id ? "bg-violet-50 text-violet-800" : "text-slate-600 hover:bg-slate-100"}`}>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{c.title}</div>
                <div className="text-[10.5px] text-slate-400">{fmtWhen(c.updatedAt)} · {c.count} сообщ.</div>
              </div>
              <button onClick={(e) => removeChat(c.id, e)}
                className="rounded p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                aria-label="Удалить диалог">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Диалог */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">AI-чат</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">Оперирует всем CRM: задачи, клиенты, тарифы, память, 1С · только супер-админ</p>
        </div>
        <Card className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            {!items.length && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><Sparkles className="size-6" /></span>
                <div className="text-[13.5px] text-slate-500">Поручите задачу — агент сам прочитает данные и выполнит действия.</div>
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
                      <MessageContent text={m.content} />
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
    </div>
  );
}
