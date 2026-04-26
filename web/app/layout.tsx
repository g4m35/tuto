import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import ThemeScript from "@/components/ThemeScript";
import { cn } from "@/lib/utils";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const fontSerif = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  style: ["italic"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Tuto",
  description: "AI tutoring that keeps the subject in focus.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

function getClerkProxyUrl() {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const vercelAppUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  const appUrl = configuredAppUrl || vercelAppUrl || "http://localhost:3000";

  return new URL("/__clerk", appUrl).toString();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(fontSans.variable, fontSerif.variable, "font-sans")}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="bg-background text-foreground font-sans">
        <ClerkProvider
          proxyUrl={getClerkProxyUrl()}
          signInFallbackRedirectUrl="/dashboard"
          signInForceRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
          signUpForceRedirectUrl="/dashboard"
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
