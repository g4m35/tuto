import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import ThemeScript from "@/components/ThemeScript";
import { AppShellProvider } from "@/context/AppShellContext";
import { I18nClientBridge } from "@/i18n/I18nClientBridge";
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
          signInFallbackRedirectUrl="/chat"
          signInForceRedirectUrl="/chat"
          signUpFallbackRedirectUrl="/chat"
          signUpForceRedirectUrl="/chat"
        >
          <AppShellProvider>
            <I18nClientBridge>
              {children}
            </I18nClientBridge>
          </AppShellProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
