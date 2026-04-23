import "server-only";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { DatabaseConfigurationError, query } from "@/lib/db";
import type { BillingTier } from "@/lib/limits";
import { checkLimit, type UsageEventType } from "@/lib/usage";

interface UserTierRow {
  tier: BillingTier | string;
}

function isBillingTier(value: string): value is BillingTier {
  return value === "free" || value === "pro" || value === "team";
}

async function getUserTier(clerkId: string): Promise<BillingTier> {
  const result = await query<UserTierRow>(
    `
      select tier
      from users
      where clerk_id = $1
      limit 1
    `,
    [clerkId],
  );

  const tier = result.rows[0]?.tier;
  return tier && isBillingTier(tier) ? tier : "free";
}

type UsageLimitedHandler<TContext> = (
  request: Request,
  context: TContext & { clerkId: string },
) => Promise<Response>;

export function withUsageLimit<TContext = unknown>(
  eventType: UsageEventType,
  handler: UsageLimitedHandler<TContext>,
) {
  return async (request: Request, context: TContext): Promise<Response> => {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    let usage;
    try {
      usage = await checkLimit(userId, eventType);
    } catch (error) {
      if (error instanceof DatabaseConfigurationError) {
        return NextResponse.json(
          {
            error: "database_not_configured",
            detail: error.message,
          },
          { status: 503 },
        );
      }

      throw error;
    }

    if (!usage.allowed) {
      const tier = await getUserTier(userId);

      return NextResponse.json(
        {
          error: "limit_reached",
          tier,
          limit: usage.limit,
          current: usage.current,
          upgrade_url: "/pricing",
        },
        { status: 429 },
      );
    }

    return handler(request, {
      ...(context as TContext),
      clerkId: userId,
    });
  };
}
