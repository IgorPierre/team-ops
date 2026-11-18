/**
 * Markdown checklist items (`- [ ] item`, `* [x] item`, `1. [X] item`) in a
 * card's text. Agents and people write acceptance criteria this way; the
 * board turns the ticks into a progress bar.
 */
const ITEM = /^\s*(?:[-*+]|\d+[.)])\s+\[([ xX])\]\s+\S/;

export interface ChecklistProgress {
  done: number;
  total: number;
}

export function checklistProgress(...texts: (string | null | undefined)[]): ChecklistProgress {
  let done = 0;
  let total = 0;
  for (const text of texts) {
    if (!text) continue;
    for (const line of text.split("\n")) {
      const match = ITEM.exec(line);
      if (!match) continue;
      total++;
      if (match[1] !== " ") done++;
    }
  }
  return { done, total };
}

/** The text without its checklist lines, for one-line previews. */
export function stripChecklist(text: string | null | undefined) {
  if (!text) return "";
  return text
    .split("\n")
    .filter((line) => !ITEM.test(line))
    .join("\n")
    .trim();
}
