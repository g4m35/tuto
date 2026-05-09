"use client";

import { AuthFormFrame } from "@/components/auth/AuthFormFrame";

export function AuthPageShell({ mode }: { mode: "sign-in" | "sign-up" }) {
  const title = mode === "sign-in" ? "Sign in to Tuto" : "Create your Tuto account";
  const subtitle =
    mode === "sign-in"
      ? "Pick up where you left off with your courses, decks, and study materials."
      : "Start generating courses, decks, and study materials from the sources you trust.";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,var(--bg-elev)_0%,var(--bg)_58%,var(--info-soft)_100%)] px-4 py-8 text-[var(--text)] sm:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1040px] items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.55fr)] lg:items-center">
          <div className="hidden space-y-6 lg:block">
            <p className="t-eyebrow">
              <span className="t-eyebrow__rule" aria-hidden="true" />
              <span>Secure access</span>
            </p>
            <div className="space-y-5">
              <h1 className="max-w-2xl text-[58px] font-semibold leading-[1.02] tracking-normal">
                {title}
              </h1>
              <p className="max-w-xl text-lg leading-8 text-[var(--text-dim)]">{subtitle}</p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[420px] space-y-6 lg:mx-0">
            <div className="text-center lg:hidden">
              <h1 className="[font-family:var(--font-serif)] text-5xl font-normal italic leading-none text-[var(--text)]">
                tuto.
              </h1>
              <p className="mt-4 text-sm leading-6 text-[var(--text-dim)]">{subtitle}</p>
            </div>
            <AuthFormFrame mode={mode} />
          </div>
        </div>
      </section>
    </main>
  );
}
