export function BrandMark({ className = "size-9" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 ${className}`}>
      <svg viewBox="0 0 100 100" className="h-[68%] w-[68%]" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M34 82 V38 Q34 20 52 20 Q60 20 65 24"
          fill="none"
          stroke="#2563eb"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M22 46 H50" stroke="#2563eb" strokeWidth="9" strokeLinecap="round" />
        <circle cx="49" cy="30" r="6.5" fill="#ef4444" />
        <path
          d="M34 68 L58 44 L70 56 L88 30"
          fill="none"
          stroke="#2563eb"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M74 26 L90 28 L88 44" fill="none" stroke="#2563eb" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
