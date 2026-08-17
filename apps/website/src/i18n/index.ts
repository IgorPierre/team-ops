import { en } from "./en";
import { es } from "./es";
import { pt } from "./pt";
import { DEFAULT_LOCALE, LOCALES, type Locale, type Messages } from "./types";

export {
  DEFAULT_LOCALE,
  HTML_LANG,
  LOCALE_COOKIE,
  LOCALE_LABEL,
  LOCALES,
  type Locale,
  type Messages,
} from "./types";

const catalog: Record<Locale, Messages> = { en, pt, es };

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function getMessages(locale: string): Messages {
  return catalog[isLocale(locale) ? locale : DEFAULT_LOCALE];
}
