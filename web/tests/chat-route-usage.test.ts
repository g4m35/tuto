import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

test("chat route relies on withUsageLimit commit instead of recording usage twice", () => {
  const source = readFileSync(join(process.cwd(), "app/api/chat/route.ts"), "utf8");

  assert.match(source, /withUsageLimit\("message"/);
  assert.doesNotMatch(source, /recordUsage\(/);
});
