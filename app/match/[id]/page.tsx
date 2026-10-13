import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MatchExperience } from "@/components/MatchExperience";
import { getExplanations, getMatch, getMatchIds } from "@/lib/data";

export async function generateStaticParams() {
  return getMatchIds();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) return { title: "Match not found" };
  return {
    title: `${match.info.teams.join(" v ")} · ${match.info.date}`,
    description: `${match.info.whyInteresting} Explore each delivery and the moments that changed the match.`,
    openGraph: {
      title: `${match.info.teams.join(" v ")} — WhyThisMoment`,
      description: match.info.whyInteresting,
      images: [`/share/${id}/match/opengraph-image`],
    },
  };
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) notFound();
  const explanationStore: Record<string, import("@/lib/types").Explanation> =
    {};
  const allExplanations = await getExplanations();
  const stored = allExplanations[id] ?? {};
  for (const moment of match.analysis.moments) {
    for (const depth of ["new-fan", "nerd"] as const) {
      for (const lang of ["en", "hi"] as const) {
        const key = `${moment.id}:${depth}:${lang}`;
        if (stored[key]) explanationStore[key] = stored[key];
      }
    }
  }
  return (
    <MatchExperience
      info={match.info}
      raw={match.raw}
      analysis={match.analysis}
      explanations={explanationStore}
    />
  );
}
