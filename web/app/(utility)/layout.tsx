import UtilitySidebar from "@/components/sidebar/UtilitySidebar";

export default function UtilityLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="t-app flex h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_0%,var(--bg)_0%,var(--ink-warm)_72%)] text-[var(--text)]">
      <UtilitySidebar />
      <main className="t-route flex-1 overflow-hidden bg-transparent">{children}</main>
    </div>
  );
}
