import type { HTMLAttributes, ReactNode } from "react";

import { cn, heading } from "@/lib/styles";

type CardProps = HTMLAttributes<HTMLElement> & {
  tone?: "light" | "dark";
  background?: ReactNode;
  contentClassName?: string;
};

export function Card({
  tone = "light",
  background,
  className,
  contentClassName,
  children,
  ...props
}: CardProps) {
  return (
    <article
      className={cn(
        "relative flex min-h-[210px] min-w-0 flex-col overflow-hidden rounded-3xl border border-rule shadow-card",
        tone === "dark" ? "bg-graphite text-white" : "bg-paper-2 text-ink",
        className,
      )}
      {...props}
    >
      {background ? <div className="absolute inset-0 z-0">{background}</div> : null}
      <div className={cn("relative z-10 flex h-full min-h-[210px] flex-col p-4 sm:p-6 lg:p-8", contentClassName)}>
        {children}
      </div>
    </article>
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(heading, "text-[1.25rem] sm:text-[1.85rem] lg:text-[2.1rem]", className)}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-3 max-w-[46ch] text-[clamp(1rem,2.5vw,1.175rem)] leading-relaxed sm:mt-4", className)}
      {...props}
    />
  );
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-auto pt-4", className)} {...props} />;
}

export function Code({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <code className={cn("font-mono text-accent", className)} {...props} />;
}
