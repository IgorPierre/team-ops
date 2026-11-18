"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils";

import { DialogCloseButton, DialogOverlay } from "./dialog";

/**
 * Carbon's Drawer: a floating grey shell docked right with a 12px gutter,
 * header and footer on the shell, content in a white panel inside it.
 */
export const Sheet = DialogPrimitive.Root;
export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;

export function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "bg-accent dark:bg-card shadow-button-base fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border outline-none sm:inset-y-3 sm:right-3 sm:rounded-xl",
          "dark:shadow-surface dark:border-transparent",
          "data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right duration-300",
          className,
        )}
        {...props}
      >
        {children}
        <DialogCloseButton className="top-2.5 right-3" />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("text-muted-foreground flex shrink-0 flex-col gap-1 px-6 py-4 pr-14", className)} {...props} />
  );
}

export function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-card dark:bg-muted/40 -mx-px flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto border p-6 sm:rounded-xl",
        className,
      )}
      {...props}
    />
  );
}

export function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex shrink-0 items-center justify-end gap-2 px-6 py-4", className)} {...props} />;
}
