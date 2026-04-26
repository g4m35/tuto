import { auth } from "@clerk/nextjs/server"

import { TopNav } from "@/components/ui/TopNav"

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await auth.protect({ unauthenticatedUrl: "/sign-in" })

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,var(--bg)_0%,var(--ink-warm)_72%)] text-[var(--text)]">
      <TopNav />
      <div className="t-route mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[1408px] flex-col px-6 pb-24 pt-10 sm:px-8 lg:px-10">
        {children}
      </div>
    </div>
  )
}
