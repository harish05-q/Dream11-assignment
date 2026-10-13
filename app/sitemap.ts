import type { MetadataRoute } from "next";
import { getMatches } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const matches = await getMatches();
  const base = process.env.SITE_URL ?? "http://localhost:3000";
  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/method`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    ...matches.map((match) => ({
      url: `${base}/match/${match.id}`,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
