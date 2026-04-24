import test from "node:test";
import assert from "node:assert/strict";

import { apiUrl, wsUrl } from "../lib/api";

test("apiUrl routes DeepTutor HTTP calls through the same-origin proxy", () => {
  assert.equal(apiUrl("/api/v1/knowledge/list"), "/api/deeptutor/api/v1/knowledge/list");
  assert.equal(apiUrl("api/v1/knowledge/list"), "/api/deeptutor/api/v1/knowledge/list");
});

test("wsUrl requests a signed backend WebSocket URL from the proxy", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({ url: "wss://backend.test/api/v1/ws?dt_ws_token=abc" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    const url = await wsUrl("/api/v1/ws");
    assert.equal(
      requestedUrl,
      "/api/deeptutor/ws-token?path=%2Fapi%2Fv1%2Fws",
    );
    assert.equal(url, "wss://backend.test/api/v1/ws?dt_ws_token=abc");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
