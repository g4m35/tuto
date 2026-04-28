import "server-only";

import type { User } from "@clerk/nextjs/server";

function splitEnvList(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

function getAdminEmails() {
  return splitEnvList(process.env.TUTO_ADMIN_EMAILS ?? process.env.ADMIN_EMAILS);
}

function getAdminUserIds() {
  return splitEnvList(process.env.TUTO_ADMIN_USER_IDS ?? process.env.ADMIN_USER_IDS);
}

export function canAccessOperatorSettings(userId: string, user: User | null) {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const adminUserIds = getAdminUserIds();
  if (adminUserIds.has(userId.toLowerCase())) {
    return true;
  }

  const adminEmails = getAdminEmails();
  const userEmails = (user?.emailAddresses ?? []).map((email) => email.emailAddress.toLowerCase());

  return userEmails.some((email) => adminEmails.has(email));
}
