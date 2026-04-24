import "server-only";

export function getDeepTutorUrl() {
  return process.env.DEEPTUTOR_URL?.replace(/\/$/, "") ?? "";
}

export function getDeepTutorApiKey() {
  return process.env.DEEPTUTOR_API_KEY ?? "";
}

export function getDeepTutorAuthHeaders(): Record<string, string> {
  const apiKey = getDeepTutorApiKey();
  return apiKey ? { Authorization: `Bearer ${apiKey}`, "X-API-Key": apiKey } : {};
}
