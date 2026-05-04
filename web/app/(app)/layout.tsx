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
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,var(--bg)_58%,#eef6ff_100%)] text-[var(--text)]">
      <TopNav />
      <div className="t-route mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[1760px] flex-col px-5 pb-16 pt-7 sm:px-7 lg:px-8">
        {children}
      </div>
    </div>
  )
}
