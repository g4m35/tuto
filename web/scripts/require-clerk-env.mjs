import fs from "node:fs";
import path from "node:path";

const REQUIRED_KEYS = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
];

const RECOMMENDED_GUARDS = {
  NEXT_PUBLIC_CLERK_KEYLESS_DISABLED: "true",
};

function parseEnvFile(filePath) {
  const values = {};

  if (!fs.existsSync(filePath)) {
    return values;
  }

  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function isPlaceholder(value) {
  return (
    !value ||
    value.includes("your_publishable_key") ||
    value.includes("your_secret_key")
  );
}

const projectRoot = process.cwd();
const mergedEnv = {
  ...parseEnvFile(path.join(projectRoot, ".env")),
  ...parseEnvFile(path.join(projectRoot, ".env.local")),
  ...parseEnvFile(path.join(projectRoot, ".env.development")),
  ...parseEnvFile(path.join(projectRoot, ".env.development.local")),
  ...process.env,
};

const missingRequiredKeys = REQUIRED_KEYS.filter((key) =>
  isPlaceholder(mergedEnv[key]),
);

const missingGuards = Object.entries(RECOMMENDED_GUARDS).filter(
  ([key, expectedValue]) => String(mergedEnv[key] || "").toLowerCase() !== expectedValue,
);

if (!missingRequiredKeys.length && !missingGuards.length) {
  process.exit(0);
}

const lines = [
  "",
  "[clerk] Refusing to start dev server without a fully configured Clerk instance.",
  "",
  "This app uses committed Clerk integration. Starting Next.js without real Clerk keys",
  "can trigger Clerk keyless mode and auto-create a second temporary app in the dashboard.",
  "",
];

if (missingRequiredKeys.length) {
  lines.push("Missing required values:");
  for (const key of missingRequiredKeys) {
    lines.push(`- ${key}`);
  }
  lines.push("");
}

if (missingGuards.length) {
  lines.push("Set these guard values:");
  for (const [key, expectedValue] of missingGuards) {
    lines.push(`- ${key}=${expectedValue}`);
  }
  lines.push("");
}

lines.push("Add them to web/.env.local and try again.");

console.error(lines.join("\n"));
process.exit(1);
