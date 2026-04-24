export type LaunchHealthCheckStatus = "pass" | "warn" | "fail";
export type LaunchHealthStatus = "ok" | "degraded" | "fail";

export interface LaunchHealthCheck {
  name: string;
  status: LaunchHealthCheckStatus;
  summary: string;
  details?: Record<string, unknown>;
}

export function getLaunchHealthStatus(checks: readonly LaunchHealthCheck[]): LaunchHealthStatus {
  if (checks.some((check) => check.status === "fail")) {
    return "fail";
  }

  if (checks.some((check) => check.status === "warn")) {
    return "degraded";
  }

  return "ok";
}

export function getLaunchHealthHttpStatus(status: LaunchHealthStatus) {
  return status === "fail" ? 503 : 200;
}
