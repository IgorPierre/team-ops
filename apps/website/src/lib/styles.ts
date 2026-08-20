export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const wrap =
  "mx-auto w-full min-w-0 max-w-page px-[clamp(16px,4vw,64px)]";

export const focusRing =
  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-focus";

export const heading =
  "min-w-0 wrap-anywhere font-display text-ink not-italic font-normal tracking-[-0.03em] leading-[1.08]";

export const more = cn("mt-6 inline-block text-[1.05rem] font-medium text-accent-2 sm:text-[1.125rem]", focusRing);

export const section = "py-10 sm:py-16";
export const sectionHead = "mx-auto mb-8 max-w-3xl text-center sm:mb-10";
export const sectionTitle = cn(heading, "text-[clamp(1.625rem,5vw+0.35rem,3.5rem)]");
export const sectionLead = "mt-3 text-[clamp(1rem,2.5vw,1.25rem)] leading-[1.55] text-ink-2 sm:mt-4";
export const bodyCopy = "text-[clamp(1rem,2.5vw,1.2rem)] leading-[1.65]";
