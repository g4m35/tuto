import test from "node:test";
import assert from "node:assert/strict";
import {
  getLaunchHealthHttpStatus,
  getLaunchHealthStatus,
  type LaunchHealthCheck,
} from "../lib/launch-health";

test("launch health is ok when all checks pass", () => {
  const checks: LaunchHealthCheck[] = [
    { name: "database", status: "pass", summary: "ok" },
    { name: "billing", status: "pass", summary: "ok" },
  ];

  assert.equal(getLaunchHealthStatus(checks), "ok");
  assert.equal(getLaunchHealthHttpStatus("ok"), 200);
});

test("launch health is degraded when any check warns", () => {
  const checks: LaunchHealthCheck[] = [
    { name: "database", status: "pass", summary: "ok" },
    { name: "app_url", status: "warn", summary: "warn" },
  ];

  assert.equal(getLaunchHealthStatus(checks), "degraded");
  assert.equal(getLaunchHealthHttpStatus("degraded"), 200);
});

test("launch health fails when any required check fails", () => {
  const checks: LaunchHealthCheck[] = [
    { name: "database", status: "pass", summary: "ok" },
    { name: "deeptutor", status: "fail", summary: "fail" },
  ];

  assert.equal(getLaunchHealthStatus(checks), "fail");
  assert.equal(getLaunchHealthHttpStatus("fail"), 503);
});
