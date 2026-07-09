import { Construction } from "lucide-react";
import { Card } from "../components/ui";

export default function Stub({ title, note }: { title: string; note: string }) {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <Card className="flex flex-col items-center gap-3 p-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Construction className="size-6" />
        </span>
        <div className="font-semibold">Раздел переносится из прототипа</div>
        <p className="max-w-sm text-sm text-slate-500">{note}</p>
      </Card>
    </div>
  );
}
