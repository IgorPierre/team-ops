"use client";

import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { focusRing } from "@/components/ui/styles";
import { useT } from "@/lib/i18n";
import { ROLE_DISPLAY } from "@/lib/task-display";
import { cn, initials } from "@/lib/utils";
import { useWorkspace } from "@/providers/workspace-provider";

function OrgMark({ name }: { name: string }) {
  return (
    <span className="bg-foreground text-background flex size-5 shrink-0 items-center justify-center rounded text-[9px] font-semibold tracking-normal">
      {initials(name)}
    </span>
  );
}

/**
 * Current organization with a menu to switch. Switching drops the page's
 * filters (project, person…) because they belong to the old organization.
 */
export function OrganizationSwitcher() {
  const { organizations, org, setOrgId } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();

  if (!org) {
    return (
      <div
        className="bg-muted h-8 w-36 animate-pulse rounded-md"
        aria-hidden="true"
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={org.name}
        title={org.name}
        className={cn(
          "hover:bg-primary/10 data-[state=open]:bg-primary/10 flex h-8 max-w-56 min-w-0 items-center gap-2 rounded-md px-2 text-left text-sm font-medium transition-colors",
          focusRing,
        )}
      >
        <OrgMark name={org.name} />
        <span className="text-foreground hidden truncate sm:block">{org.name}</span>
        <ChevronsUpDownIcon className="text-muted-foreground size-3.5 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[240px]">
        <DropdownMenuLabel>{t("Organizations")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={org.id}
          onValueChange={(id) => {
            if (id === org.id) return;
            setOrgId(id);
            router.replace(pathname);
          }}
        >
          {organizations.map((item) => (
            <DropdownMenuRadioItem key={item.id} value={item.id}>
              <OrgMark name={item.name} />
              <span className="truncate">{item.name}</span>
              <span className="text-muted-foreground ml-auto text-xs">
                {item.role
                  ? t(ROLE_DISPLAY[item.role]?.label ?? item.role)
                  : null}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/onboarding?new=1">
            <PlusIcon />
            {t("New organization")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
