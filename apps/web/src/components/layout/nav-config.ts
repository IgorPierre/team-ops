import {
  BarChart3Icon,
  BotIcon,
  Columns3Icon,
  GanttChartIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Path prefixes that mark this item as current. "/" matches only itself. */
  match: readonly string[];
}

export interface NavSection {
  /** Section label. `null` uses the current organization's name. */
  title: string | null;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "General",
    items: [
      { href: "/", label: "Board", icon: Columns3Icon, match: ["/"] },
      {
        href: "/timeline",
        label: "Timeline",
        icon: GanttChartIcon,
        match: ["/timeline"],
      },
      {
        href: "/reports",
        label: "Reports",
        icon: BarChart3Icon,
        match: ["/reports"],
      },
    ],
  },
  {
    title: "Team",
    items: [
      {
        href: "/settings/members",
        label: "People",
        icon: UsersIcon,
        match: ["/settings/members", "/people"],
      },
      {
        href: "/settings/agents",
        label: "Agents",
        icon: BotIcon,
        match: ["/settings/agents"],
      },
    ],
  },
];

export function isNavItemActive(pathname: string, item: NavItem) {
  return item.match.some((m) =>
    m === "/"
      ? pathname === "/"
      : pathname === m || pathname.startsWith(`${m}/`),
  );
}

export function activeNavItem(pathname: string) {
  return NAV_SECTIONS.flatMap((s) => s.items).find((item) =>
    isNavItemActive(pathname, item),
  );
}
