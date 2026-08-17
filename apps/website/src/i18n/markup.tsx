import { Fragment, type ReactNode } from "react";

const TOKEN = /(\*\*[^*]+\*\*|==[^=]+==|`[^`]+`)/g;

export function InlineMarkup({ text }: { text: string }) {
  const parts = text.split(TOKEN);
  const nodes: ReactNode[] = parts.map((chunk, i) => {
    if (chunk.startsWith("**") && chunk.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-ink">
          {chunk.slice(2, -2)}
        </strong>
      );
    }
    if (chunk.startsWith("==") && chunk.endsWith("==")) {
      return (
        <mark key={i} className="bg-transparent text-accent">
          {chunk.slice(2, -2)}
        </mark>
      );
    }
    if (chunk.startsWith("`") && chunk.endsWith("`")) {
      return (
        <code key={i} className="font-mono text-accent">
          {chunk.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{chunk}</Fragment>;
  });
  return <>{nodes}</>;
}
