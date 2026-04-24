import "server-only";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { DatabaseConfigurationError } from "@/lib/db";
import {
  commitUsageReservation,
  releaseUsageReservation,
  reserveUsage,
  type UsageEventType,
  type UsageReservation,
} from "@/lib/usage";

type UsageLimitedHandler<TContext> = (
  request: Request,
  context: TContext & { clerkId: string; usageReservation: UsageReservation },
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

    let reserved;
    try {
      reserved = await reserveUsage(userId, eventType);
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

    if (!reserved.ok) {
      return NextResponse.json(
        {
          error: "limit_reached",
          tier: reserved.usage.tier,
          limit: reserved.usage.limit,
          current: reserved.usage.current,
          upgrade_url: "/pricing",
        },
        { status: 429 },
      );
    }

    const reservation = reserved.reservation;
    try {
      const response = await handler(request, {
        ...(context as TContext),
        clerkId: userId,
        usageReservation: reservation,
      });

      if (response.status < 400) {
        await commitUsageReservation(reservation);
      } else {
        await releaseUsageReservation(reservation);
      }

      return response;
    } catch (error) {
      await releaseUsageReservation(reservation);
      throw error;
    }
  };
}
