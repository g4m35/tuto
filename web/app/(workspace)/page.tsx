"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Root page now redirects to /dashboard by default.
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
      : "/dashboard";

    const query: string[] = [];
    if (capability) query.push(`capability=${encodeURIComponent(capability)}`);
    tools.forEach((t) => query.push(`tool=${encodeURIComponent(t)}`));
    if (query.length) target += `?${query.join("&")}`;

    router.replace(target);
  }, [router]);

  return null;
}
