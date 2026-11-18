"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { LogoMark } from "@/components/logo-mark";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { isNavItemActive, NAV_SECTIONS, type NavItem } from "./nav-config";

/** Carbon's rail item: a 40px square that widens into a labelled row when the rail opens. */
const railItem = cn(
  "group/item relative flex h-10 w-10 shrink-0 items-center rounded-md font-medium select-none",
  "text-foreground/70 hover:text-foreground group-data-[state=expanded]:w-full",
  "transition-[background-color,color,width] duration-100 ease-out",
  "outline-none after:pointer-events-none after:absolute after:-inset-[3px] after:rounded-lg after:border after:border-blue-500 after:opacity-0 after:ring-2 after:ring-blue-500/20 after:transition-opacity focus-visible:after:opacity-100",
);

function RailContent({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <>
      <span className="absolute top-2 left-2 flex size-6 items-center justify-center [&>svg]:size-4">
        {icon}
      </span>
      <span
        aria-hidden="true"
        className="absolute right-3 left-12 truncate text-left text-sm opacity-0 transition-opacity duration-200 group-data-[state=expanded]:opacity-100"
      >
        {label}
      </span>
    </>
  );
}

function RailLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const t = useT();
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-label={t(item.label)}
      aria-current={active ? "page" : undefined}
      className={cn(
        railItem,
        active
          ? "bg-active text-active-foreground dark:shadow-button-base"
          : "hover:bg-active/60 hover:text-active-foreground",
      )}
    >
      <RailContent icon={<Icon />} label={t(item.label)} />
    </Link>
  );
}

function RailGroup({ label }: { label: string }) {
  return (
    <div className="relative my-1 h-6 w-full" aria-hidden="true">
      <span className="bg-border absolute inset-x-0 top-1/2 mx-auto h-px w-6 opacity-100 transition-opacity duration-200 group-data-[state=expanded]:opacity-0" />
      <span className="text-foreground/50 absolute inset-0 flex items-center px-2 text-[11px] font-medium tracking-wider whitespace-nowrap uppercase opacity-0 transition-opacity duration-200 group-data-[state=expanded]:opacity-100">
        {label}
      </span>
    </div>
  );
}

function RailBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const t = useT();
  return (
    <div className="flex h-full flex-col justify-between gap-1 px-2">
      <div className="flex flex-col gap-1">
        <Link
          href="/"
          onClick={onNavigate}
          aria-label={t("Team-Ops home")}
          className={cn(railItem, "mb-2 hover:bg-transparent")}
        >
          <RailContent
            icon={
              <span className="bg-foreground flex size-6 items-center justify-center rounded-md">
                <LogoMark className="h-3" />
              </span>
            }
            label="Team-Ops"
          />
        </Link>
        {NAV_SECTIONS.map((section, index) => (
          <div key={section.title ?? index} className="flex flex-col gap-1">
            {index > 0 ? (
              <RailGroup label={t(section.title ?? "Workspace")} />
            ) : null}
            {section.items.map((item) => (
              <RailLink
                key={item.href}
                item={item}
                active={isNavItemActive(pathname, item)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// A pointer only passing over the rail (on its way to the page) shouldn't open it.
const HOVER_OPEN_DELAY_MS = 150;

/**
 * Carbon's NavRail: a 56px icon rail on the grey frame that grows to 208px
 * while a mouse rests on it, pushing the content panel instead of covering it.
 */
export function AppSidebar() {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const state = expanded ? "expanded" : "collapsed";

  return (
    <div
      data-state={state}
      className="sticky top-0 hidden h-svh w-14 shrink-0 flex-col transition-[width] duration-200 data-[state=expanded]:w-[13rem] md:flex"
    >
      <nav
        aria-label={t("Main")}
        data-state={state}
        className="group bg-background h-full w-full overflow-x-hidden overflow-y-auto py-2"
        onPointerMove={(event) => {
          if (event.pointerType !== "mouse" || expanded || timer.current)
            return;
          timer.current = setTimeout(() => {
            timer.current = undefined;
            setExpanded(true);
          }, HOVER_OPEN_DELAY_MS);
        }}
        onPointerLeave={() => {
          clearTimeout(timer.current);
          timer.current = undefined;
          setExpanded(false);
        }}
      >
        <RailBody />
      </nav>
    </div>
  );
}

/** The same navigation, always expanded, for the phone drawer. */
export function MobileNavigation({ onNavigate }: { onNavigate: () => void }) {
  const t = useT();
  return (
    <nav
      aria-label={t("Main")}
      data-state="expanded"
      className="group h-full overflow-y-auto py-2"
    >
      <RailBody onNavigate={onNavigate} />
    </nav>
  );
}
