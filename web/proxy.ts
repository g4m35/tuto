import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const clerkProxyUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  ? new URL("/__clerk", process.env.NEXT_PUBLIC_APP_URL).toString()
  : "";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pdf-to-course(.*)",
  "/ai-study-course(.*)",
  "/training-docs-to-course(.*)",
  "/robots.txt",
  "/sitemap.xml",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing(.*)",
  "/support(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/refund-policy(.*)",
  "/api/version(.*)",
  "/api/health(.*)",
  "/api/health/deeptutor(.*)",
  "/api/beta-signups(.*)",
  "/api/marketing/events(.*)",
  "/api/share(.*)",
  "/api/webhooks(.*)",
  "/share(.*)",
]);

function getSignInUrl(req: NextRequest) {
  const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const origin = publicAppUrl || req.nextUrl.origin;
  const redirectTarget = publicAppUrl
    ? new URL(`${req.nextUrl.pathname}${req.nextUrl.search}`, publicAppUrl).toString()
    : req.nextUrl.href;
  const url = new URL("/sign-in", origin);
  url.searchParams.set("redirect_url", redirectTarget);
  return url.toString();
}

export default clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.pathname === "/settings" || req.nextUrl.pathname.startsWith("/settings/")) {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  if (isPublicRoute(req)) {
    return;
  }

  if (req.nextUrl.pathname.startsWith("/api/")) {
    await auth.protect();
    return;
  }

  await auth.protect({ unauthenticatedUrl: getSignInUrl(req) });
}, clerkProxyUrl
  ? {
      frontendApiProxy: {
        enabled: true,
        path: "/__clerk",
      },
    }
  : {});

export const config = {
  matcher: [
    "/__clerk(.*)",
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
