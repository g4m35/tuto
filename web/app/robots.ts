import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://tuto.chat";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account",
        "/agents",
        "/api/",
        "/book",
        "/chat",
        "/co-writer",
        "/courses",
        "/create",
        "/dashboard",
        "/knowledge",
        "/memory",
        "/notebook",
        "/playground",
        "/review",
        "/settings",
      ],
    },
    sitemap: new URL("/sitemap.xml", appUrl).toString(),
  };
}
