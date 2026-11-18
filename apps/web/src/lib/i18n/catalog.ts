import type { Locale } from "./config";
import { agents } from "./messages/agents";
import { auth } from "./messages/auth";
import { board } from "./messages/board";
import { common } from "./messages/common";
import { layout } from "./messages/layout";
import { people } from "./messages/people";
import { reports } from "./messages/reports";
import { timeline } from "./messages/timeline";

const AREAS = [common, layout, board, timeline, reports, people, agents, auth];

export const CATALOG: Record<Exclude<Locale, "en">, Record<string, string>> = {
  pt: Object.assign({}, ...AREAS.map((a) => a.pt)),
  es: Object.assign({}, ...AREAS.map((a) => a.es)),
};
