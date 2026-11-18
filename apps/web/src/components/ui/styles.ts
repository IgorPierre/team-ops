/**
 * Class fragments shared by form controls so every input, select, textarea
 * and button gets the same border, radius and focus treatment (Carbon).
 */
export const focusRing =
  "outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export const controlBase =
  "border-input bg-transparent text-foreground placeholder:text-muted-foreground flex w-full rounded-md border shadow-xs transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30";

/** Carbon's dark-mode raised surface: a hairline highlight instead of a border. */
export const raisedSurface = "dark:border-transparent dark:shadow-surface";
