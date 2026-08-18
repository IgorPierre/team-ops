import { cn } from "@/lib/styles";

export function LogoMark({ className = "h-[1.15em]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 176 221"
      fill="#10B981"
      className={cn("w-auto shrink-0", className)}
      aria-hidden="true"
    >
      <rect width="52" height="221" />
      <rect x="64" width="34" height="53" />
      <rect x="124" width="52" height="221" />
    </svg>
  );
}
