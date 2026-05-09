import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingPageClient from "@/components/marketing/LandingPageClient";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return <LandingPageClient />;
}
