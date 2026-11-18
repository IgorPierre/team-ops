"use client";

import { createContext, useContext } from "react";
import { createPortal } from "react-dom";

const PageActionsContext = createContext<HTMLElement | null>(null);

/** Provided by the app shell: the topbar element page actions render into. */
export const PageActionsProvider = PageActionsContext.Provider;

/**
 * Renders a page's primary actions (New task, Export CSV…) in the topbar,
 * next to the breadcrumbs, so the page itself starts with its content.
 */
export function PageActions({ children }: { children: React.ReactNode }) {
  const target = useContext(PageActionsContext);
  return target ? createPortal(children, target) : null;
}
