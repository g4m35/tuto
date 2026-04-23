const REQUIRED_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_KEYLESS_DISABLED",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRO_PRICE_ID",
  "STRIPE_TEAM_PRICE_ID",
  "DEEPTUTOR_URL",
];

const DATABASE_KEYS = ["DATABASE_URL", "POSTGRES_URL"];

const PLACEHOLDER_PATTERNS = [
  /your_/i,
  /placeholder/i,
  /^pk_test_your/i,
  /^sk_test_your/i,
  /^whsec_your/i,
  /^price_your/i,
];

function isMissing(value) {
  return !value || PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

const missing = REQUIRED_KEYS.filter((key) => isMissing(process.env[key]));

if (String(process.env.NEXT_PUBLIC_CLERK_KEYLESS_DISABLED).toLowerCase() !== "true") {
  missing.push("NEXT_PUBLIC_CLERK_KEYLESS_DISABLED=true");
}

if (!DATABASE_KEYS.some((key) => !isMissing(process.env[key]))) {
  missing.push("DATABASE_URL or POSTGRES_URL");
}

if (missing.length) {
  console.error("");
  console.error("[env] Production web environment is incomplete.");
  console.error("");
  console.error("Set these values before building or starting the hosted web app:");
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  console.error("");
  console.error("See web/.env.example and LAUNCH_RUNBOOK.md for the complete contract.");
  process.exit(1);
}
