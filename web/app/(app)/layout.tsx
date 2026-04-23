import { TopNav } from "@/components/ui/TopNav"

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="app-shell min-h-screen bg-background text-foreground">
      <TopNav />
      <div className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-[1440px] flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  )
}
