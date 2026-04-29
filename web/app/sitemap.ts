import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://tuto.chat";
  const today = new Date();

  return [
    {
      url: new URL("/", appUrl).toString(),
      lastModified: today,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/pdf-to-course", appUrl).toString(),
      lastModified: today,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: new URL("/ai-study-course", appUrl).toString(),
      lastModified: today,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: new URL("/training-docs-to-course", appUrl).toString(),
      lastModified: today,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: new URL("/pricing", appUrl).toString(),
      lastModified: today,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: new URL("/privacy", appUrl).toString(),
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: new URL("/terms", appUrl).toString(),
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: new URL("/support", appUrl).toString(),
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
