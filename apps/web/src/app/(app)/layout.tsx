import { AppShell, AppShellSkeleton } from "@/components/layout/app-shell";
import { WorkspaceProvider } from "@/providers/workspace-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider fallback={<AppShellSkeleton />}>
      <AppShell>{children}</AppShell>
    </WorkspaceProvider>
  );
}
