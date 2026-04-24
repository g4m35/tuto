import "server-only";

import { createHmac } from "node:crypto";
import { getDeepTutorApiKey } from "@/lib/deeptutor-config";

const DEFAULT_TTL_SECONDS = 60;

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function normalizeWsPath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized.split("?")[0] || "/";
}

export function createDeepTutorWsToken(input: { path: string; clerkId: string }) {
  const secret = getDeepTutorApiKey();
  if (!secret) {
    throw new Error("DEEPTUTOR_API_KEY is required to mint DeepTutor WebSocket tokens.");
  }

  const ttlSeconds = Number(process.env.DEEPTUTOR_WS_TOKEN_TTL_SECONDS ?? DEFAULT_TTL_SECONDS);
  const payload = {
    path: normalizeWsPath(input.path),
    sub: input.clerkId,
    exp: Math.floor(Date.now() / 1000) + (Number.isFinite(ttlSeconds) ? ttlSeconds : DEFAULT_TTL_SECONDS),
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}
