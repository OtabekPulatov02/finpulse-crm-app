import { useEffect, useState } from "react";
import { Download, FileText, Loader2, X } from "lucide-react";
import { fetchTaskFileBlob } from "../api";

/* Тот же паттерн, что и у toast() в ui.tsx: глобальная функция +
   единственный слушатель, смонтированный один раз в Layout. Так любое
   место в приложении может открыть предпросмотр вложения без прокидывания
   пропсов через десяток компонентов. */
type PreviewRequest = { num: number; index: number; label?: string };
let pushPreview: ((req: PreviewRequest | null) => void) | null = null;

export function previewFile(num: number, index: number, label?: string) {
  pushPreview?.({ num, index, label });
}

export function FilePreviewer() {
  const [req, setReq] = useState<PreviewRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [mime, setMime] = useState("");

  useEffect(() => {
    pushPreview = setReq;
    return () => { pushPreview = null; };
  }, []);

  useEffect(() => {
    if (!req) { setUrl(null); setError(null); setMime(""); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setUrl(null);
    fetchTaskFileBlob(req.num, req.index)
      .then((blob) => {
        if (cancelled) return;
        setMime(blob.type || "");
        setUrl(URL.createObjectURL(blob));
      })
      .catch(() => { if (!cancelled) setError("Не удалось загрузить файл"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [req]);

  const close = () => {
    if (url) URL.revokeObjectURL(url);
    setReq(null);
  };

  if (!req) return null;

  const isImage = mime.startsWith("image/");
  const isPdf = mime === "application/pdf";
  const isVideo = mime.startsWith("video/");
  const isAudio = mime.startsWith("audio/");
  const isPreviewable = isImage || isPdf || isVideo || isAudio;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 p-5 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="flex max-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="truncate text-[13px] font-medium text-slate-600">{req.label || "Вложение"}</div>
          <div className="flex shrink-0 items-center gap-1">
            {url && (
              <a href={url} download title="Скачать"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <Download className="size-4" />
              </a>
            )}
            <button onClick={close} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="size-4" />
            </button>
          </div>
        </div>
        <div className="flex min-h-64 flex-1 items-center justify-center overflow-auto bg-slate-50 p-4">
          {loading && (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Loader2 className="size-6 animate-spin" />
              <span className="text-[12.5px]">Загружаем файл…</span>
            </div>
          )}
          {!loading && error && (
            <div className="flex flex-col items-center gap-2 text-red-500">
              <FileText className="size-8" />
              <span className="text-[13px]">{error}</span>
            </div>
          )}
          {!loading && !error && url && isImage && (
            <img src={url} alt="" className="max-h-[70vh] max-w-full rounded-lg object-contain" />
          )}
          {!loading && !error && url && isPdf && (
            <iframe src={url} title="Предпросмотр PDF" className="h-[70vh] w-full rounded-lg border border-slate-200 bg-white" />
          )}
          {!loading && !error && url && isVideo && (
            <video src={url} controls className="max-h-[70vh] max-w-full rounded-lg" />
          )}
          {!loading && !error && url && isAudio && (
            <audio src={url} controls className="w-full" />
          )}
          {!loading && !error && url && !isPreviewable && (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <FileText className="size-10 text-slate-300" />
              <span className="text-[13px]">Предпросмотр недоступен для этого типа файла</span>
              <a href={url} download
                className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-brand-700">
                <Download className="size-4" /> Скачать файл
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
