const unavailableErrorCodes = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
]);

type DeepTutorFallbackEnv = Partial<
  Pick<NodeJS.ProcessEnv, "NODE_ENV" | "DEEPTUTOR_DISABLE_LOCAL_STUB_FALLBACK">
>;

function getErrorCode(value: unknown) {
  return value && typeof value === "object" && "code" in value
    ? String((value as { code?: unknown }).code)
    : "";
}

export function isDeepTutorUnavailableError(error: unknown): boolean {
  if (error instanceof TypeError && /fetch failed/i.test(error.message)) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  if (/fetch failed|network|connection refused|timed out/i.test(error.message)) {
    return true;
  }

  const cause = (error as Error & { cause?: unknown }).cause;
  return unavailableErrorCodes.has(getErrorCode(cause));
}

export function canUseLocalDeepTutorFallback(
  env: DeepTutorFallbackEnv = process.env,
) {
  return env.NODE_ENV !== "production" && env.DEEPTUTOR_DISABLE_LOCAL_STUB_FALLBACK !== "true";
}

export function shouldUseLocalDeepTutorFallback(
  error: unknown,
  env: DeepTutorFallbackEnv = process.env,
) {
  return canUseLocalDeepTutorFallback(env) && isDeepTutorUnavailableError(error);
}
