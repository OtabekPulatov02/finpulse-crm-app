import { Bot, FileText, MessageSquareText, Receipt, Sparkles, Tags } from "lucide-react";
import { Badge, Card, CardHeader, Toggle } from "../components/ui";

const FEATURES = [
  { icon: Tags, title: "Классификация заявок", desc: "ИИ определяет категорию и подкатегорию задачи из текста клиента (поступление, списание, отчёт, кадры…)", stage: "план" },
  { icon: FileText, title: "Черновики документов 1С", desc: "Из заявки клиента формируется черновик документа в 1С — непроведённый, бухгалтер проверяет и отправляет через Didox", stage: "план" },
  { icon: Receipt, title: "Черновики платёжек", desc: "ИИ готовит платёжное поручение (контрагент, счёт, сумма, назначение) для проверки бухгалтером", stage: "план" },
  { icon: MessageSquareText, title: "Суммаризация переписки", desc: "Краткая выжимка длинных обращений клиента в карточке задачи", stage: "план" },
];

export default function IntegrationAI() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI-интеграция</h1>
        <p className="mt-0.5 text-sm text-slate-500">Claude API · автоматизация бухгалтерских операций до этапа отправки</p>
      </div>

      <Card>
        <CardHeader title="Подключение" action={<Badge tone="yellow">не активировано</Badge>} />
        <div className="space-y-3 p-5 text-[13.5px]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">API-ключ Anthropic</div>
              <div className="text-xs text-slate-400">Переменная ANTHROPIC_API_KEY в Vercel — задаётся владельцем, в браузер не передаётся</div>
            </div>
            <Badge tone="gray">не задан</Badge>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div>
              <div className="font-medium">Модель</div>
              <div className="text-xs text-slate-400">claude-sonnet — баланс цены и качества для черновиков</div>
            </div>
            <Badge tone="blue">по умолчанию</Badge>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Функции" action={<Sparkles className="size-4 text-slate-400" />} />
        <div className="divide-y divide-slate-100">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-center gap-4 px-5 py-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <f.icon className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold">{f.title}</div>
                <div className="mt-0.5 text-[12.5px] leading-relaxed text-slate-500">{f.desc}</div>
              </div>
              <Toggle defaultChecked={false} />
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2.5 border-t border-slate-100 px-5 py-3.5 text-[12.5px] text-slate-500">
          <Bot className="mt-0.5 size-4 shrink-0 text-slate-400" />
          Раздел-заготовка: тумблеры сохранятся и заработают на этапе «ИИ-интеграция» дорожной карты. ИИ никогда не проводит операции сам — только готовит черновики для проверки бухгалтером.
        </div>
      </Card>
    </div>
  );
}
