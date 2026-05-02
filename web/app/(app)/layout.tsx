import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { TopNav } from "@/components/ui/TopNav"

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,var(--bg)_58%,#eef8f4_100%)] text-[var(--text)]">
      <TopNav />
      <div className="t-route mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[1408px] flex-col px-6 pb-24 pt-10 sm:px-8 lg:px-10">
        {children}
      </div>
    </div>
  )
}
