import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { canAccessOperatorSettings } from "@/lib/admin-access";

export default async function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (process.env.NODE_ENV === "production") {
    redirect("/account");
  }

  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  if (!canAccessOperatorSettings(userId, user)) {
    redirect("/account");
  }

  return children;
}
