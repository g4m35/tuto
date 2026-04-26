import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const clerkProxyPath = "/__clerk";

const isPublicRoute = createRouteMatcher([
  "/",
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
  "/api/webhooks(.*)",
  `${clerkProxyPath}(.*)`,
]);

export default clerkMiddleware(
  async (auth, req) => {
    if (isPublicRoute(req)) {
      return;
    }

    await auth.protect();
  },
  {
    frontendApiProxy: {
      enabled: true,
      path: clerkProxyPath,
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc|__clerk)(.*)",
  ],
};
