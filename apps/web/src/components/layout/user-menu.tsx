"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  BotIcon,
  Columns3Icon,
  LanguagesIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  PaletteIcon,
  SunIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import { UserAvatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { focusRing } from "@/components/ui/styles";
import { Switch } from "@/components/ui/switch";
import { useMounted } from "@/hooks/use-mounted";
import { useThemeColor } from "@/hooks/use-theme-color";
import { api } from "@/lib/api";
import { isLocale, LOCALE_NAME, LOCALES, useLocale, useT } from "@/lib/i18n";
import { THEME_COLORS, isThemeColor } from "@/lib/theme-color";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/providers/workspace-provider";

/**
 * Carbon's avatar menu: who you are, quick links, and the per-browser
 * appearance settings (dark mode, theme colour) one click away.
 */
export function UserMenu() {
  const { user } = useWorkspace();
  const router = useRouter();
  const queryClient = useQueryClient();
  const mounted = useMounted();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [color, setColor] = useThemeColor();
  const [locale, setLocale] = useLocale();
  const t = useT();
  const dark = mounted && resolvedTheme === "dark";

  async function signOut() {
    await api.logout();
    queryClient.clear();
    router.replace("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("Account menu")}
        className={cn(
          "rounded-full transition-opacity hover:opacity-90",
          focusRing,
        )}
      >
        <UserAvatar name={user.name} src={user.avatarUrl} size="sm" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="truncate">
          {t("Signed in as {name}", { name: user.name })}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/">
            <Columns3Icon />
            {t("Board")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/people/${user.id}`}>
            <UserIcon />
            {t("My profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/agents">
            <BotIcon />
            {t("Connect a coding agent")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* The whole row toggles; the switch only shows the state. */}
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            setTheme(dark ? "light" : "dark");
          }}
        >
          {dark ? <MoonIcon /> : <SunIcon />}
          {t("Dark mode")}
          <Switch
            checked={dark}
            tabIndex={-1}
            aria-hidden="true"
            className="pointer-events-none ml-auto"
          />
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            setTheme("system");
          }}
        >
          <MonitorIcon />
          {t("Match system")}
          <Switch
            checked={mounted && theme === "system"}
            tabIndex={-1}
            aria-hidden="true"
            className="pointer-events-none ml-auto"
          />
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <PaletteIcon />
            {t("Theme color")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={color}
              onValueChange={(value) => isThemeColor(value) && setColor(value)}
            >
              {THEME_COLORS.map((option) => (
                <DropdownMenuRadioItem
                  key={option.value}
                  value={option.value}
                  onSelect={(e) => e.preventDefault()}
                >
                  <span
                    className="size-4 shrink-0 rounded-full"
                    style={{
                      background: dark
                        ? option.swatch.dark
                        : option.swatch.light,
                    }}
                    aria-hidden="true"
                  />
                  {t(option.label)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <LanguagesIcon />
            {t("Language")}
            <span className="text-muted-foreground ml-auto text-xs">
              {LOCALE_NAME[locale]}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={locale}
              onValueChange={(value) => isLocale(value) && setLocale(value)}
            >
              {LOCALES.map((code) => (
                <DropdownMenuRadioItem
                  key={code}
                  value={code}
                  lang={code}
                  onSelect={(e) => e.preventDefault()}
                >
                  {LOCALE_NAME[code]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOutIcon />
          {t("Sign out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
