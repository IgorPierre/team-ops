"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { focusRing } from "./styles";

/** Carbon's Modal: blurred backdrop, rounded-2xl card, tinted footer bar. */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 fixed inset-0 z-50 bg-black/10 backdrop-blur-sm max-md:bg-black/40",
        className,
      )}
      {...props}
    />
  );
}

export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "bg-card fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-4rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border pt-6 shadow-md outline-none",
          "dark:shadow-surface dark:border-transparent",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-200",
          className,
        )}
        {...props}
      >
        {children}
        <CloseButton />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({
  title,
  description,
  icon,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small icon before the title. */
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex shrink-0 flex-col gap-1.5 px-6 pr-14", className)}>
      <DialogPrimitive.Title className="text-foreground flex items-center gap-2 text-base leading-none font-medium tracking-tight [&_svg]:size-4">
        {icon}
        {title}
      </DialogPrimitive.Title>
      {description ? (
        <DialogPrimitive.Description className="text-muted-foreground text-sm">{description}</DialogPrimitive.Description>
      ) : null}
    </div>
  );
}

export function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mb-4 flex min-h-0 flex-col gap-4 overflow-y-auto px-6", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-muted/40 flex shrink-0 flex-col-reverse gap-2 border-t px-6 py-3 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function CloseButton({ className }: { className?: string }) {
  const t = useT();
  return (
    <DialogPrimitive.Close
      className={cn(
        "hover:bg-accent absolute top-3 right-3 inline-flex items-center justify-center rounded-full p-2.5 opacity-70 transition-opacity hover:opacity-100",
        focusRing,
        className,
      )}
    >
      <XIcon className="size-4" />
      <span className="sr-only">{t("Close")}</span>
    </DialogPrimitive.Close>
  );
}

export { CloseButton as DialogCloseButton };
