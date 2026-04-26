import { auth } from "@clerk/nextjs/server";
import { TopNav } from "@/components/ui/TopNav";
import { UnifiedChatProvider } from "@/context/UnifiedChatContext";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await auth.protect();

  return (
    <UnifiedChatProvider>
      <div className="t-app flex min-h-dvh flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_0%,var(--bg)_0%,var(--ink-warm)_72%)] text-[var(--text)]">
        <TopNav />
        <main className="t-route min-h-0 flex-1 overflow-hidden bg-transparent">{children}</main>
      </div>
    </UnifiedChatProvider>
  );
}
