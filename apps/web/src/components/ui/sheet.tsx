"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function Sheet({ ...props }: React.ComponentProps<typeof Dialog.Root>) {
  return <Dialog.Root {...props} />;
}

export function SheetTrigger(props: React.ComponentProps<typeof Dialog.Trigger>) {
  return <Dialog.Trigger {...props} />;
}

export function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Dialog.Content>) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out fixed inset-0 z-50 bg-black/30" />
      <Dialog.Content
        className={cn(
          "bg-background fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l shadow-lg",
          className,
        )}
        {...props}
      >
        {children}
        <Dialog.Close className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-sm opacity-70 hover:opacity-100 focus:ring-2 focus:outline-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

export function SheetTitle(props: React.ComponentProps<typeof Dialog.Title>) {
  return <Dialog.Title className="text-lg font-semibold" {...props} />;
}
