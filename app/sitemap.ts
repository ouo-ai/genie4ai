import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/terms", "/privacy", "/refunds", "/contact"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path ? "monthly" : "weekly",
    priority: path ? 0.3 : 1,
  }));
}
