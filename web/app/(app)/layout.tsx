import { auth } from "@clerk/nextjs/server"

import { TopNav } from "@/components/ui/TopNav"

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await auth.protect({ unauthenticatedUrl: "/sign-in" })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <div className="t-route mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[1200px] flex-col px-5 pb-24 pt-10 sm:px-8">
        {children}
      </div>
    </div>
  )
}
