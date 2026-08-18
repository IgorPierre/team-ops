"use client";

import type { Member, Organization, Project, User } from "@team-ops/api-client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { BotIcon, Columns3Icon, LogOutIcon, MoonIcon, SunIcon, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { BoardFilters, type BoardFilterState } from "@/components/board/board-filters";
import { LogoMark } from "@/components/logo-mark";
import { OrganizationSwitcher } from "@/components/layout/organization-switcher";
import { ProjectSwitcher } from "@/components/layout/project-switcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { cn, initials } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Board", icon: Columns3Icon },
  { href: "/settings/members", label: "People", icon: UsersIcon },
  { href: "/settings/agents", label: "Agents", icon: BotIcon },
] as const;

export function AppSidebar({
  user,
  organizations,
  orgId,
  onOrgChange,
  projects,
  projectId,
  onProjectChange,
  members,
  filters,
  onFiltersChange,
}: {
  user: User;
  organizations: Organization[];
  orgId?: string;
  onOrgChange: (id: string) => void;
  projects: Project[];
  projectId: string;
  onProjectChange: (id: string) => void;
  members: Member[];
  filters: BoardFilterState;
  onFiltersChange: (next: BoardFilterState) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <aside className="bg-card flex h-full w-[15.5rem] shrink-0 flex-col border-r">
      <div className="flex items-center gap-2 px-4 py-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight">
          <LogoMark className="h-5" />
          Team-Ops
        </Link>
      </div>
      <div className="px-3">
        <div className="flex items-center gap-2 rounded-lg px-1 py-1">
          <Avatar className="size-8">
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
          </div>
        </div>
      </div>
      <div className="px-3 pt-4">
        <BoardFilters members={members} value={filters} onChange={onFiltersChange} />
      </div>
      <nav className="flex flex-col gap-0.5 px-3 pt-5">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-col gap-2 px-3 pt-5">
        <p className="text-muted-foreground px-0.5 text-[11px] font-medium tracking-wide uppercase">
          Workspace
        </p>
        <OrganizationSwitcher organizations={organizations} value={orgId} onChange={onOrgChange} />
        <ProjectSwitcher projects={projects} value={projectId} onChange={onProjectChange} />
      </div>
      <div className="mt-auto flex flex-col gap-3 p-3">
        <button
          type="button"
          className="border-border bg-card inline-flex items-center rounded-full border p-0.5"
          aria-label={isDark ? "Use light theme" : "Use dark theme"}
          aria-pressed={isDark}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          <span
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-full",
              !isDark && mounted && "bg-muted",
            )}
            aria-hidden="true"
          >
            <SunIcon className="size-4" />
          </span>
          <span
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-full",
              isDark && "bg-muted",
            )}
            aria-hidden="true"
          >
            <MoonIcon className="size-4" />
          </span>
        </button>
        <Separator />
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground justify-start"
          onClick={async () => {
            await api.logout();
            router.replace("/login");
          }}
        >
          <LogOutIcon />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
