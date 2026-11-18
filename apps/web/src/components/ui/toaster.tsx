"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

/** Compact popover-styled toasts in the bottom-right corner (Carbon). */
export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      position="bottom-right"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      closeButton
      toastOptions={{
        classNames: {
          toast: "!rounded-xl !border-border !bg-popover !text-popover-foreground !shadow-popover !text-sm !font-medium",
          description: "!font-normal !opacity-80",
        },
      }}
    />
  );
}
