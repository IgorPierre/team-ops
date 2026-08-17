export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const wrap =
  "mx-auto w-full min-w-0 max-w-page px-[clamp(24px,4vw,64px)]";

export const focusRing =
  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-focus";

export const heading =
  "min-w-0 wrap-anywhere font-display text-ink not-italic font-normal tracking-[-0.03em] leading-[1.08]";

export const more = cn("mt-6 inline-block text-[1.125rem] font-medium text-accent-2", focusRing);

export const section = "py-16";
export const sectionHead = "mx-auto mb-10 max-w-3xl text-center";
export const sectionTitle = cn(heading, "text-[clamp(2rem,4.2vw+0.5rem,3.5rem)]");
export const sectionLead = "mt-4 text-[1.25rem] leading-[1.55] text-ink-2";
export const bodyCopy = "text-[1.2rem] leading-[1.65]";
