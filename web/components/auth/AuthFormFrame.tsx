"use client";

import { ClerkLoaded, ClerkLoading, SignIn, SignUp, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const clerkAppearance = {
  variables: {
    borderRadius: "10px",
    colorBackground: "#ffffff",
    colorDanger: "#c2413a",
    colorInputBackground: "#f8fcfa",
    colorInputText: "#102a43",
    colorNeutral: "#829ab1",
    colorPrimary: "#102a43",
    colorText: "#102a43",
    colorTextSecondary: "#486581",
    fontFamily: "var(--font-sans), Inter, ui-sans-serif, system-ui, sans-serif",
    fontFamilyButtons: "var(--font-sans), Inter, ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    rootBox: "w-full max-w-[400px]",
    cardBox: "w-full shadow-none",
    card: "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow)] sm:p-6",
    headerTitle: "text-[22px] font-semibold tracking-normal text-[var(--text)]",
    headerSubtitle: "text-[13px] leading-5 text-[var(--text-dim)]",
    socialButtonsBlockButton:
      "h-[46px] rounded-full border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text)] hover:bg-[var(--info-soft)]",
    socialButtonsBlockButtonText: "text-[13px] font-medium text-[var(--text)]",
    dividerLine: "bg-[var(--border)]",
    dividerText: "text-[11px] uppercase tracking-[0.18em] text-[var(--text-faint)]",
    formFieldLabel: "text-[12px] font-medium text-[var(--text-dim)]",
    formFieldInput:
      "rounded-[10px] border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text)] shadow-none focus:border-[var(--border-strong)] focus:shadow-none",
    formButtonPrimary:
      "h-[46px] rounded-full bg-[var(--accent)] text-[var(--accent-ink)] shadow-none hover:bg-[var(--accent-strong)] focus:shadow-none",
    footerActionText: "text-[13px] text-[var(--text-dim)]",
    footerActionLink: "text-[13px] font-medium text-[var(--text)] hover:text-[var(--info-strong)]",
    identityPreview: "rounded-[10px] border border-[var(--border)] bg-[var(--bg-soft)]",
    identityPreviewEditButton: "text-[var(--text)] hover:text-[var(--info-strong)]",
    formResendCodeLink: "text-[var(--text)] hover:text-[var(--info-strong)]",
    otpCodeFieldInput:
      "rounded-[10px] border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text)]",
    alert: "rounded-[10px] border border-[var(--danger)]/30 bg-[var(--warm-soft)] text-[var(--text)]",
    alertText: "text-[var(--text)]",
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
    <div className="w-full max-w-[400px] rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5 text-center shadow-[var(--shadow)] sm:p-6">
      <div className="mx-auto h-6 w-32 rounded-full bg-[var(--bg-soft)]" />
      <div className="mt-6 space-y-3">
        <div className="h-10 rounded-[10px] bg-[var(--bg-soft)]" />
        <div className="h-10 rounded-[10px] bg-[var(--bg-soft)]" />
        <div className="h-[46px] rounded-full bg-[var(--accent)]" />
      </div>
      <p className="mt-5 text-[13px] leading-5 text-[var(--text-dim)]">
        {isSlow
          ? "Still connecting. Refresh to continue."
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
            oauthFlow="popup"
            path="/sign-in"
            routing="path"
            fallbackRedirectUrl="/dashboard"
            signUpUrl="/sign-up"
            signUpFallbackRedirectUrl="/dashboard"
          />
        ) : (
          <SignUp
            appearance={clerkAppearance}
            oauthFlow="popup"
            path="/sign-up"
            routing="path"
            fallbackRedirectUrl="/dashboard"
            signInUrl="/sign-in"
            signInFallbackRedirectUrl="/dashboard"
          />
        )}
      </ClerkLoaded>
    </div>
  );
}
