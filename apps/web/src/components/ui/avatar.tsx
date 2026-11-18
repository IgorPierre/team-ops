"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";

import { cn, initials } from "@/lib/utils";

/** Carbon's avatar palette (light text-on-pastel / dark white-on-deep), picked by name. */
const AVATAR_COLORS = [
  "bg-[#e3e2e0] text-[#32302c] dark:bg-[#5a5a5a] dark:text-white",
  "bg-[#eee0da] text-[#442a1e] dark:bg-[#603b2c] dark:text-white",
  "bg-[#fadec9] text-[#49290e] dark:bg-[#854c1d] dark:text-white",
  "bg-[#f9e4bc] text-[#402c1b] dark:bg-[#835e33] dark:text-white",
  "bg-[#dbeddb] text-[#1c3829] dark:bg-[#2b593f] dark:text-white",
  "bg-[#d3e5ef] text-[#183347] dark:bg-[#28456c] dark:text-white",
  "bg-[#e8deee] text-[#412454] dark:bg-[#492f64] dark:text-white",
  "bg-[#f5e0e9] text-[#4c2337] dark:bg-[#69314c] dark:text-white",
  "bg-[#ffe2dd] text-[#5d1715] dark:bg-[#6e3630] dark:text-white",
] as const;

export function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium",
  {
    variants: {
      size: {
        xs: "size-6 text-xxs",
        sm: "size-8 text-xs",
        md: "size-10 text-sm",
        lg: "size-12 text-base",
        xl: "size-16 text-xl",
      },
    },
    defaultVariants: { size: "sm" },
  },
);

/** Photo when there is one, initials otherwise. */
export function UserAvatar({
  name,
  src,
  size,
  className,
}: { name: string; src?: string | null; className?: string } & VariantProps<typeof avatarVariants>) {
  return (
    <AvatarPrimitive.Root className={cn(avatarVariants({ size }), avatarColor(name), className)}>
      {src ? <AvatarPrimitive.Image src={src} alt="" className="size-full object-cover" /> : null}
      <AvatarPrimitive.Fallback delayMs={src ? 300 : 0}>{initials(name)}</AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

/** Avatar + name + secondary line, as used in tables and menus. */
export function UserIdentity({
  name,
  badge,
  description,
  src,
  size = "md",
  className,
}: {
  name: string;
  /** Inline after the name (e.g. a "You" badge). */
  badge?: React.ReactNode;
  description?: React.ReactNode;
  src?: string | null;
  className?: string;
} & VariantProps<typeof avatarVariants>) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <UserAvatar name={name} src={src} size={size} />
      <div className="min-w-0">
        <div className="text-foreground flex items-center gap-2 text-sm font-medium">
          <span className="truncate">{name}</span>
          {badge}
        </div>
        {description ? <div className="text-muted-foreground truncate text-xs">{description}</div> : null}
      </div>
    </div>
  );
}
