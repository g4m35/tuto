import test from "node:test";
import assert from "node:assert/strict";
import {
  captureMarketingEvent,
  isBetaSignupSinkConfigured,
  isMarketingEventForwardingConfigured,
  recordBetaSignup,
} from "../lib/marketing";

function withMarketingEnv<T>(callback: () => T) {
  const previous = {
    DATABASE_URL: process.env.DATABASE_URL,
    POSTGRES_URL: process.env.POSTGRES_URL,
    POSTHOG_PROJECT_API_KEY: process.env.POSTHOG_PROJECT_API_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    BETA_SIGNUP_WEBHOOK_URL: process.env.BETA_SIGNUP_WEBHOOK_URL,
  };

  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  delete process.env.POSTHOG_PROJECT_API_KEY;
  delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  delete process.env.BETA_SIGNUP_WEBHOOK_URL;

  try {
    return callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("marketing sink checks are false when no database, PostHog, or webhook is configured", () => {
  withMarketingEnv(() => {
    assert.equal(isBetaSignupSinkConfigured(), false);
    assert.equal(isMarketingEventForwardingConfigured(), false);
  });
});

test("marketing event capture accepts anonymous events without configured sinks", async () => {
  await withMarketingEnv(async () => {
    const result = await captureMarketingEvent({
      name: "landing_page_viewed",
      distinctId: "anon_123",
      source: "test",
      properties: {
        variant: "default",
      },
    });

    assert.deepEqual(result, {
      accepted: true,
      stored: false,
      forwarded: false,
    });
  });
});

test("beta signup accepts valid input without configured local sinks", async () => {
  await withMarketingEnv(async () => {
    const result = await recordBetaSignup({
      email: "learner@example.com",
      name: "Learner",
      useCase: "Certification prep",
      materialType: "PDF",
      marketingOptIn: true,
    });

    assert.deepEqual(result, {
      accepted: true,
      stored: false,
      forwarded: false,
    });
  });
});

test("beta signup rejects missing email", async () => {
  await withMarketingEnv(async () => {
    const result = await recordBetaSignup({
      email: "",
    });

    assert.deepEqual(result, {
      accepted: false,
      stored: false,
      forwarded: false,
    });
  });
});
