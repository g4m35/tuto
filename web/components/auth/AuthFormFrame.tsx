"use client";

import { ClerkLoaded, ClerkLoading, SignIn, SignUp, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const clerkAppearance = {
  variables: {
    borderRadius: "14px",
    colorBackground: "#111111",
    colorDanger: "#fafafa",
    colorInputBackground: "#161616",
    colorInputText: "#fafafa",
    colorNeutral: "#6b6b6b",
    colorPrimary: "#fafafa",
    colorText: "#fafafa",
    colorTextSecondary: "#a3a3a3",
    fontFamily: "var(--font-sans), Inter, ui-sans-serif, system-ui, sans-serif",
    fontFamilyButtons: "var(--font-sans), Inter, ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    rootBox: "w-full max-w-[400px]",
    cardBox: "w-full shadow-none",
    card: "w-full rounded-[14px] border border-white/[0.07] bg-[#111111] p-5 shadow-none sm:p-6",
    headerTitle: "text-[22px] font-medium tracking-normal text-[#fafafa]",
    headerSubtitle: "text-[13px] leading-5 text-[#a3a3a3]",
    socialButtonsBlockButton:
      "h-[46px] rounded-full border-white/[0.16] bg-transparent text-[#fafafa] hover:bg-[#161616]",
    socialButtonsBlockButtonText: "text-[13px] font-medium text-[#fafafa]",
    dividerLine: "bg-white/[0.07]",
    dividerText: "text-[11px] uppercase tracking-[0.18em] text-[#6b6b6b]",
    formFieldLabel: "text-[12px] font-medium text-[#a3a3a3]",
    formFieldInput:
      "rounded-[10px] border-white/[0.07] bg-[#161616] text-[#fafafa] shadow-none focus:border-white/[0.16] focus:shadow-none",
    formButtonPrimary:
      "h-[46px] rounded-full bg-[#fafafa] text-[#0a0a0a] shadow-none hover:bg-[#d4d4d4] focus:shadow-none",
    footerActionText: "text-[13px] text-[#a3a3a3]",
    footerActionLink: "text-[13px] font-medium text-[#fafafa] hover:text-[#d4d4d4]",
    identityPreview: "rounded-[10px] border border-white/[0.07] bg-[#161616]",
    identityPreviewEditButton: "text-[#fafafa] hover:text-[#d4d4d4]",
    formResendCodeLink: "text-[#fafafa] hover:text-[#d4d4d4]",
    otpCodeFieldInput:
      "rounded-[10px] border-white/[0.07] bg-[#161616] text-[#fafafa]",
    alert: "rounded-[10px] border border-white/[0.16] bg-[#161616] text-[#fafafa]",
    alertText: "text-[#fafafa]",
  },
};

function AuthLoadingCard() {
  const { isLoaded } = useAuth();
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsSlow(true), 4_000);
    return () => window.clearTimeout(timeout);
  }, []);

  if (isLoaded) {
    return null;
  }

  return (
    <div className="w-full max-w-[400px] rounded-[14px] border border-white/[0.07] bg-[#111111] p-5 text-center sm:p-6">
      <div className="mx-auto h-6 w-32 rounded-full bg-[#1f1f1f]" />
      <div className="mt-6 space-y-3">
        <div className="h-10 rounded-[10px] bg-[#161616]" />
        <div className="h-10 rounded-[10px] bg-[#161616]" />
        <div className="h-[46px] rounded-full bg-[#fafafa]" />
      </div>
      <p className="mt-5 text-[13px] leading-5 text-[#a3a3a3]">
        {isSlow
          ? "Still connecting to sign-in. Refreshing this page should continue here."
          : "Opening secure sign-in..."}
      </p>
    </div>
  );
}

export function AuthFormFrame({ mode }: { mode: "sign-in" | "sign-up" }) {
  return (
    <div className="w-full max-w-[400px]">
      <ClerkLoading>
        <AuthLoadingCard />
      </ClerkLoading>
      <ClerkLoaded>
        {mode === "sign-in" ? (
          <SignIn
            appearance={clerkAppearance}
            fallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/dashboard"
          />
        ) : (
          <SignUp
            appearance={clerkAppearance}
            fallbackRedirectUrl="/dashboard"
            signInFallbackRedirectUrl="/dashboard"
          />
        )}
      </ClerkLoaded>
    </div>
  );
}
