import test from "node:test";
import assert from "node:assert/strict";
import {
  canUseLocalDeepTutorFallback,
  isDeepTutorUnavailableError,
  shouldUseLocalDeepTutorFallback,
} from "../lib/deeptutor-fallback";

test("local DeepTutor fallback recognizes unavailable backend fetch failures", () => {
  assert.equal(isDeepTutorUnavailableError(new TypeError("fetch failed")), true);
  assert.equal(
    isDeepTutorUnavailableError(
      Object.assign(new Error("request failed"), {
        cause: { code: "ECONNREFUSED" },
      }),
    ),
    true,
  );
  assert.equal(isDeepTutorUnavailableError(new Error("DeepTutor returned a bad lesson")), false);
});

test("local DeepTutor fallback is disabled in production or by env override", () => {
  assert.equal(canUseLocalDeepTutorFallback({ NODE_ENV: "development" }), true);
  assert.equal(canUseLocalDeepTutorFallback({ NODE_ENV: "production" }), false);
  assert.equal(
    canUseLocalDeepTutorFallback({
      NODE_ENV: "development",
      DEEPTUTOR_DISABLE_LOCAL_STUB_FALLBACK: "true",
    }),
    false,
  );
});

test("local DeepTutor fallback only applies to unavailable backend errors outside production", () => {
  assert.equal(
    shouldUseLocalDeepTutorFallback(new TypeError("fetch failed"), { NODE_ENV: "development" }),
    true,
  );
  assert.equal(
    shouldUseLocalDeepTutorFallback(new TypeError("fetch failed"), { NODE_ENV: "production" }),
    false,
  );
  assert.equal(
    shouldUseLocalDeepTutorFallback(new Error("bad payload"), { NODE_ENV: "development" }),
    false,
  );
});
