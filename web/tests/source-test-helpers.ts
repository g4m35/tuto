import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(testsDir, "..");

export function getWebPath(...segments: string[]): string {
  return path.join(webDir, ...segments);
}

export function readWebFile(...segments: string[]): string {
  const target = getWebPath(...segments);
  return readFileSync(target, "utf8");
}

export function expectWebFile(...segments: string[]): string {
  const target = getWebPath(...segments);
  assert.equal(
    existsSync(target),
    true,
    `Expected ${path.relative(webDir, target)} to exist`,
  );
  return target;
}

export function assertIncludes(
  source: string,
  snippet: string,
  message: string,
): void {
  assert.match(source, new RegExp(escapeRegExp(snippet)), message);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
