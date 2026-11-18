import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BlockerAlert } from "./blocker-alert";

const state = vi.hoisted(() => ({ isAdmin: true, data: [] as { id: string }[] }));
vi.mock("@/providers/workspace-provider", () => ({ useWorkspace: () => ({ isAdmin: state.isAdmin }) }));
vi.mock("@/hooks/use-blockers", () => ({ useBlockers: () => ({ data: state.data }) }));
vi.mock("@/lib/i18n", () => ({ useT: () => (key: string, values?: { n: number }) => key.replace("{n}", String(values?.n)) }));

afterEach(cleanup);

describe("blocker alert", () => {
  it("links administrators to pending blockers", () => {
    state.isAdmin = true;
    state.data = [{ id: "task" }];
    render(<BlockerAlert />);
    expect(screen.getByRole("status").getAttribute("href")).toBe("/blockers");
    expect(screen.getByLabelText("1 pending blockers")).toBeTruthy();
  });

  it("hides the alert for members", () => {
    state.isAdmin = false;
    state.data = [{ id: "task" }];
    render(<BlockerAlert />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("clears the alert when no blockers remain", () => {
    state.isAdmin = true;
    state.data = [];
    render(<BlockerAlert />);
    expect(screen.queryByRole("status")).toBeNull();
  });
});
