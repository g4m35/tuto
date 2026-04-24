import { SignIn } from "@clerk/nextjs";

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
    headerTitle: "text-[22px] font-medium tracking-[-0.01em] text-[#fafafa]",
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

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#0a0a0a_0%,#000000_72%)] px-4 py-10 text-[#fafafa] sm:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[440px] flex-col items-center justify-center gap-8">
        <div className="w-full text-center">
          <p className="mb-5 inline-flex items-center gap-3 text-[11px] font-normal uppercase leading-none tracking-[0.18em] text-[#6b6b6b]">
            <span className="font-serif text-[14px] italic normal-case tracking-normal text-[#fafafa]">
              i
            </span>
            <span className="h-px w-4 bg-white/[0.16]" aria-hidden="true" />
            <span>Welcome back</span>
          </p>
          <h1 className="font-serif text-5xl italic leading-none text-[#fafafa] sm:text-6xl">
            tuto.
          </h1>
        </div>

        <SignIn
          appearance={clerkAppearance}
          fallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
        />
      </section>
    </main>
  );
}
