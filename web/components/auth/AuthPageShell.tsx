"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { AuthFormFrame } from "@/components/auth/AuthFormFrame";
import { cn } from "@/lib/utils";

export function AuthPageShell({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { isLoaded } = useAuth();
  const [minimumIntroElapsed, setMinimumIntroElapsed] = useState(false);
  const [forceReveal, setForceReveal] = useState(false);
  const [introLeaving, setIntroLeaving] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const label = mode === "sign-in" ? "Welcome back" : "Begin learning";

  useEffect(() => {
    const minimumTimer = window.setTimeout(() => setMinimumIntroElapsed(true), 650);
    const forceTimer = window.setTimeout(() => setForceReveal(true), 2_500);

    return () => {
      window.clearTimeout(minimumTimer);
      window.clearTimeout(forceTimer);
    };
  }, []);

  useEffect(() => {
    if (!minimumIntroElapsed || (!isLoaded && !forceReveal)) {
      return;
    }

    setIntroLeaving(true);
    const hideTimer = window.setTimeout(() => setShowIntro(false), 360);

    return () => window.clearTimeout(hideTimer);
  }, [forceReveal, isLoaded, minimumIntroElapsed]);

  const revealForm = !showIntro;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#0a0a0a_0%,#000000_72%)] px-4 py-10 text-[#fafafa] sm:px-8">
      {showIntro ? (
        <div
          className={cn(
            "fixed inset-0 z-20 flex items-center justify-center bg-[radial-gradient(circle_at_top,#0a0a0a_0%,#000000_72%)] px-6 transition-all duration-[350ms] ease-[var(--ease-signature)]",
            introLeaving ? "opacity-0 blur-sm" : "opacity-100 blur-0"
          )}
          aria-hidden={introLeaving}
        >
          <div className="text-center">
            <p className="mb-6 inline-flex items-center gap-4 text-[11px] font-normal uppercase leading-none tracking-[0.22em] text-[#6b6b6b]">
              <span className="h-px w-8 bg-white/[0.16]" aria-hidden="true" />
              <span>{label}</span>
              <span className="h-px w-8 bg-white/[0.16]" aria-hidden="true" />
            </p>
            <h1 className="font-serif text-6xl italic leading-none text-[#fafafa] sm:text-7xl">
              tuto.
            </h1>
          </div>
        </div>
      ) : null}

      <section
        className={cn(
          "mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[440px] flex-col items-center justify-center gap-8 transition-all duration-500 ease-[var(--ease-signature)]",
          revealForm ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        )}
      >
        <div className="w-full text-center">
          <p className="mb-5 inline-flex items-center gap-3 text-[11px] font-normal uppercase leading-none tracking-[0.18em] text-[#6b6b6b]">
            <span className="h-px w-5 bg-white/[0.16]" aria-hidden="true" />
            <span>{label}</span>
            <span className="h-px w-5 bg-white/[0.16]" aria-hidden="true" />
          </p>
          <h1 className="font-serif text-5xl italic leading-none text-[#fafafa] sm:text-6xl">
            tuto.
          </h1>
        </div>

        <AuthFormFrame mode={mode} />
      </section>
    </main>
  );
}
