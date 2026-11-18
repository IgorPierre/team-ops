import Link from "next/link";

import { LogoMark } from "@/components/logo-mark";
import { cn } from "@/lib/utils";

export function Brand({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-foreground inline-flex items-center gap-2.5 text-base font-medium tracking-tight",
        className,
      )}
    >
      <span className="bg-foreground flex size-7 items-center justify-center rounded-md">
        <LogoMark className="h-3.5" />
      </span>
      Team-Ops
    </Link>
  );
}
