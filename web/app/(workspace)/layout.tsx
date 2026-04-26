import { auth } from "@clerk/nextjs/server";
import { TopNav } from "@/components/ui/TopNav";
import { AppShellProvider } from "@/context/AppShellContext";
import { UnifiedChatProvider } from "@/context/UnifiedChatContext";
import { I18nClientBridge } from "@/i18n/I18nClientBridge";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await auth.protect();

  return (
    <AppShellProvider>
      <I18nClientBridge>
        <UnifiedChatProvider>
          <div className="t-app flex min-h-dvh flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_0%,var(--bg)_0%,var(--ink-warm)_72%)] text-[var(--text)]">
            <TopNav />
            <main className="t-route min-h-0 flex-1 overflow-hidden bg-transparent">{children}</main>
          </div>
        </UnifiedChatProvider>
      </I18nClientBridge>
    </AppShellProvider>
  );
}
