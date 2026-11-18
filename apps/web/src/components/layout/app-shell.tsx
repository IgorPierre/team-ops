"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { DialogOverlay } from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { AppSidebar, MobileNavigation } from "./app-sidebar";
import { activeNavItem } from "./nav-config";
import { OrganizationSwitcher } from "./organization-switcher";
import { PageActionsProvider } from "./page-actions";
import { BlockerAlert } from "./blocker-alert";
import { UserMenu } from "./user-menu";

/** Carbon breadcrumbs: organization switcher, then the current module. */
function Breadcrumbs() {
  const pathname = usePathname();
  const current = activeNavItem(pathname);
  const t = useT();

  return (
    <nav
      aria-label={t("Breadcrumb")}
      className="-ml-2 flex min-w-0 items-center overflow-hidden md:mr-auto"
    >
      <ol className="flex min-w-0 items-center gap-0.5 text-sm">
        <li className="min-w-0">
          <OrganizationSwitcher />
        </li>
        {current ? (
          <>
            <li aria-hidden="true" className="text-muted-foreground/60 px-0.5">
              /
            </li>
            <li className="min-w-0">
              <Link
                href={current.href}
                aria-current="page"
                className="text-foreground hover:bg-primary/10 flex h-8 items-center truncate rounded-md px-2 font-medium transition-colors"
              >
                {t(current.label)}
              </Link>
            </li>
          </>
        ) : null}
      </ol>
    </nav>
  );
}

function MobileDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            "bg-background fixed inset-y-0 left-0 z-50 w-[17rem] max-w-[85vw] border-r outline-none",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left duration-300",
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {t("Navigation")}
          </DialogPrimitive.Title>
          <MobileNavigation onNavigate={() => onOpenChange(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * The signed-in frame (Carbon): icon rail on the grey frame, pages inside a
 * white rounded panel inset by 8px, with a 49px topbar for breadcrumbs and
 * the account menu. Pages own everything below the topbar.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false);
  const pathname = usePathname();
  const t = useT();
  const [actionsSlot, setActionsSlot] = useState<HTMLDivElement | null>(null);

  useEffect(() => setMobileNav(false), [pathname]);

  return (
    <div className="bg-background flex h-dvh overflow-hidden">
      <AppSidebar />
      <MobileDrawer open={mobileNav} onOpenChange={setMobileNav} />

      <div className="bg-card relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden shadow-md md:my-2 md:mr-2 md:rounded-2xl md:border dark:md:border-transparent dark:shadow-surface">
        <header className="bg-card sticky top-0 z-10 grid min-h-[var(--topbar-height)] shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b px-4 py-2 md:flex md:h-[var(--topbar-height)] md:py-0">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-1 md:hidden"
            aria-label={t("Open menu")}
            onClick={() => setMobileNav(true)}
          >
            <MenuIcon />
          </Button>
          <Breadcrumbs />
          <div
            ref={setActionsSlot}
            className="col-span-3 row-start-2 flex flex-wrap items-center justify-end gap-2 empty:hidden"
          />
          <div className="col-start-3 row-start-1 flex shrink-0 items-center gap-2">
            <BlockerAlert />
            <UserMenu />
          </div>
        </header>
        <PageActionsProvider value={actionsSlot}>
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {children}
          </main>
        </PageActionsProvider>
      </div>
    </div>
  );
}

export function AppShellSkeleton() {
  return (
    <div className="bg-background flex h-dvh">
      <div className="hidden w-14 shrink-0 md:block" />
      <div className="flex-1 md:py-2 md:pr-2">
        <div className="bg-card h-full shadow-md md:rounded-2xl md:border" />
      </div>
    </div>
  );
}
