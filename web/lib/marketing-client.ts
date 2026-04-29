"use client";

export function getMarketingDistinctId() {
  if (typeof window === "undefined") {
    return "server";
  }

  const key = "tuto_marketing_distinct_id";
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const nextId = window.crypto?.randomUUID?.() ?? `anon_${Date.now()}_${Math.random()}`;
  window.localStorage.setItem(key, nextId);
  return nextId;
}

export function trackMarketingEvent(name: string, properties: Record<string, unknown> = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const payload = JSON.stringify({
    name,
    distinctId: getMarketingDistinctId(),
    source: "web",
    url: window.location.href,
    referrer: document.referrer,
    properties,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/marketing/events", new Blob([payload], { type: "application/json" }));
    return;
  }

  fetch("/api/marketing/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}
