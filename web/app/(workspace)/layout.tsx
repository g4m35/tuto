import WorkspaceSidebar from "@/components/sidebar/WorkspaceSidebar";
import { UnifiedChatProvider } from "@/context/UnifiedChatContext";

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UnifiedChatProvider>
      <div className="t-app flex h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_0%,var(--bg)_0%,var(--ink-warm)_72%)] text-[var(--text)]">
        <WorkspaceSidebar />
        <main className="t-route flex-1 overflow-hidden bg-transparent">{children}</main>
      </div>
    </UnifiedChatProvider>
  );
}
