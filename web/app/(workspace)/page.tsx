"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Root page opens the Tuto workspace.
 * Backward-compatible chat query params still route into /chat.
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session");
    const capability = params.get("capability");
    const tools = params.getAll("tool");

    const shouldOpenChat = Boolean(sessionId || capability || tools.length);
    let target = shouldOpenChat
      ? sessionId
        ? `/chat/${sessionId}`
        : "/chat"
      : "/chat";

    const query: string[] = [];
    if (capability) query.push(`capability=${encodeURIComponent(capability)}`);
    tools.forEach((t) => query.push(`tool=${encodeURIComponent(t)}`));
    if (query.length) target += `?${query.join("&")}`;

    router.replace(target);
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_50%_0%,var(--bg)_0%,var(--ink-warm)_72%)] px-6 text-[var(--text)]">
      <section className="t-route flex w-full max-w-[440px] flex-col items-center text-center">
        <p className="t-eyebrow">
          <span className="t-eyebrow__num">i</span>
          <span className="t-eyebrow__rule" aria-hidden="true" />
          <span>Opening</span>
        </p>
        <h1 className="mt-8 [font-family:var(--font-serif)] text-[56px] font-normal italic leading-none tracking-normal text-[var(--text)]">
          tuto.
        </h1>
        <p className="mt-6 max-w-sm text-[13px] leading-6 text-[var(--text-dim)]">
          Carrying you into the right workspace.
        </p>
      </section>
    </main>
  );
}
