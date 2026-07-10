export function BrandMark({ className = "h-10" }: { className?: string }) {
  return (
    <img
      src="/brand-logo-full.png"
      alt="Finpulse CRM"
      className={`w-auto object-contain ${className}`}
    />
  );
}
