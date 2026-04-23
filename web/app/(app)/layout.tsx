import { TopNav } from "@/components/ui/TopNav"

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <div className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-[1200px] flex-col px-5 pb-16 pt-10 sm:px-8">
        {children}
      </div>
    </div>
  )
}
